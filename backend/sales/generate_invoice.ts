import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { accountingDB } from "../accounting/db";
import { inventoryDB } from "../inventory/db";
import { requireRole } from "../auth/permissions";
import { invalidateAccountingReports, invalidateSalesReports } from "../accounting/invalidate_cache";

export interface GenerateInvoiceRequest {
  salesOrderId: number;
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
}

export interface GenerateInvoiceResponse {
  success: boolean;
  invoiceId: number;
  invoiceNumber: string;
  message: string;
}

export const generateInvoice = api(
  { method: "POST", path: "/sales/generate-invoice", expose: true, auth: true },
  async (req: GenerateInvoiceRequest): Promise<GenerateInvoiceResponse> => {
    requireRole(["admin", "sales", "manager"]);
    const { salesOrderId, invoiceDate, dueDate, notes } = req;

    try {
      const salesOrderQuery = `
        SELECT so.*, c.name as customer_name 
        FROM sales_orders so
        INNER JOIN customers c ON so.customer_id = c.id
        WHERE so.id = $1
      `;
      
      const salesOrderResult = await salesDB.rawQueryAll(salesOrderQuery, salesOrderId);
      
      if (salesOrderResult.length === 0) {
        return {
          success: false,
          invoiceId: 0,
          invoiceNumber: '',
          message: 'Sales order not found'
        };
      }

      const salesOrder = salesOrderResult[0];

      if (salesOrder.status !== 'confirmed') {
        return {
          success: false,
          invoiceId: 0,
          invoiceNumber: '',
          message: 'Sales order must be confirmed before generating invoice'
        };
      }

      const existingInvoiceQuery = `
        SELECT id, invoice_number 
        FROM invoices 
        WHERE sales_order_id = $1
      `;
      
      const existingInvoiceResult = await salesDB.rawQueryAll(existingInvoiceQuery, salesOrderId);
      
      if (existingInvoiceResult.length > 0) {
        return {
          success: false,
          invoiceId: existingInvoiceResult[0].id,
          invoiceNumber: existingInvoiceResult[0].invoice_number,
          message: 'Invoice already exists for this sales order'
        };
      }

      const invoiceNumberQuery = `
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 4) AS INTEGER)), 0) + 1 as next_number
        FROM invoices 
        WHERE invoice_number ~ '^INV[0-9]+$'
      `;
      
      const invoiceNumberResult = await salesDB.rawQueryRow(invoiceNumberQuery);
      const nextNumber = invoiceNumberResult?.next_number || 1;
      const invoiceNumber = `INV${nextNumber.toString().padStart(6, '0')}`;

      const currentDate = new Date().toISOString().split('T')[0];
      const finalInvoiceDate = invoiceDate || currentDate;
      const finalDueDate = dueDate || salesOrder.due_date || currentDate;

      const createInvoiceQuery = `
        INSERT INTO invoices (
          invoice_number, sales_order_id, customer_id, invoice_date, due_date,
          subtotal, tax_amount, discount_amount, total_amount, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const invoiceResult = await salesDB.rawQueryRow(createInvoiceQuery, 
        invoiceNumber,
        salesOrderId,
        salesOrder.customer_id,
        finalInvoiceDate,
        finalDueDate,
        salesOrder.subtotal,
        salesOrder.tax_amount,
        salesOrder.discount_amount,
        salesOrder.total_amount,
        notes || ''
      );

      const invoiceId = invoiceResult!.id;

      const copyItemsQuery = `
        INSERT INTO invoice_items (
          invoice_id, product_id, product_sku, product_name,
          quantity, unit_price, discount_amount, line_total
        )
        SELECT 
          $1, product_id, product_sku, product_name,
          quantity, unit_price, discount_amount, line_total
        FROM sales_order_items
        WHERE sales_order_id = $2
      `;

      await salesDB.rawExec(copyItemsQuery, invoiceId, salesOrderId);

      const customerQuery = `SELECT receivable_account_id FROM customers WHERE id = $1`;
      const customerResult = await salesDB.rawQueryRow(customerQuery, salesOrder.customer_id);
      const receivableAccountId = customerResult?.receivable_account_id;

      if (receivableAccountId) {
        const invoiceItemsQuery = `
          SELECT ii.product_id, ii.quantity, ii.line_total
          FROM invoice_items ii
          WHERE ii.invoice_id = $1
        `;
        const invoiceItems = await salesDB.rawQueryAll(invoiceItemsQuery, invoiceId);

        const entryNumberQuery = `
          SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 3) AS INTEGER)), 0) + 1 as next_number
          FROM journal_entries 
          WHERE entry_number ~ '^JE[0-9]+$'
        `;
        const entryNumberResult = await accountingDB.rawQueryRow(entryNumberQuery);
        const nextNumber = entryNumberResult?.next_number || 1;
        const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;

        const createJournalEntryQuery = `
          INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, status)
          VALUES ($1, $2, $3, $4, $5, 'posted')
          RETURNING id
        `;
        const journalEntryResult = await accountingDB.rawQueryRow(
          createJournalEntryQuery,
          entryNumber,
          finalInvoiceDate,
          `Invoice ${invoiceNumber} - ${salesOrder.customer_name}`,
          'invoice',
          invoiceId
        );
        const journalEntryId = journalEntryResult!.id;

        const insertDebitLineQuery = `
          INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description)
          VALUES ($1, $2, $3, 0, $4)
        `;
        await accountingDB.rawExec(
          insertDebitLineQuery,
          journalEntryId,
          receivableAccountId,
          salesOrder.total_amount,
          `Accounts Receivable - ${salesOrder.customer_name}`
        );

        for (const item of invoiceItems) {
          const productQuery = `SELECT revenue_account_id FROM products WHERE id = $1`;
          const productResult = await inventoryDB.rawQueryRow(productQuery, item.product_id);
          const revenueAccountId = productResult?.revenue_account_id;

          if (revenueAccountId) {
            const insertCreditLineQuery = `
              INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description)
              VALUES ($1, $2, 0, $3, $4)
            `;
            await accountingDB.rawExec(
              insertCreditLineQuery,
              journalEntryId,
              revenueAccountId,
              item.line_total,
              `Revenue from product`
            );
          }
        }
      }

      if (salesOrder.status === 'confirmed') {
        const updateOrderQuery = `
          UPDATE sales_orders 
          SET status = 'shipped', updated_at = NOW()
          WHERE id = $1
        `;
        await salesDB.rawExec(updateOrderQuery, salesOrderId);
      }

      invalidateAccountingReports();
      invalidateSalesReports();

      return {
        success: true,
        invoiceId,
        invoiceNumber,
        message: 'Invoice generated successfully'
      };

    } catch (error) {
      console.error('Error generating invoice:', error);
      return {
        success: false,
        invoiceId: 0,
        invoiceNumber: '',
        message: 'Failed to generate invoice'
      };
    }
  }
);