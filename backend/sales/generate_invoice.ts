import { api } from "encore.dev/api";
import { salesDB } from "./db";

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
  { method: "POST", path: "/sales/generate-invoice", expose: true },
  async (req: GenerateInvoiceRequest): Promise<GenerateInvoiceResponse> => {
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

      if (salesOrder.status === 'confirmed') {
        const updateOrderQuery = `
          UPDATE sales_orders 
          SET status = 'shipped', updated_at = NOW()
          WHERE id = $1
        `;
        await salesDB.rawExec(updateOrderQuery, salesOrderId);
      }

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