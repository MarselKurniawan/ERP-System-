import { api } from "encore.dev/api";
import { salesDB } from "./db";

export interface SalesReportRequest {
  startDate: string;
  endDate: string;
  customerId?: number;
  status?: string;
}

export interface SalesReportItem {
  orderNumber: string;
  invoiceNumber?: string;
  customerName: string;
  orderDate: string;
  dueDate: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface SalesReportSummary {
  totalOrders: number;
  totalInvoices: number;
  totalSales: number;
  totalPaid: number;
  totalOutstanding: number;
  averageOrderValue: number;
}

export interface SalesReportByCustomer {
  customerId: number;
  customerName: string;
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface SalesReportByProduct {
  productId: number;
  productSku: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface SalesReport {
  summary: SalesReportSummary;
  items: SalesReportItem[];
  byCustomer: SalesReportByCustomer[];
  byProduct: SalesReportByProduct[];
  periode: {
    startDate: string;
    endDate: string;
  };
}

export const salesReport = api(
  { method: "POST", path: "/sales/reports/sales", expose: true },
  async (req: SalesReportRequest): Promise<SalesReport> => {
    const { startDate, endDate, customerId, status } = req;

    let customerFilter = '';
    let statusFilter = '';
    let queryParams: any[] = [startDate, endDate];
    let paramIndex = 3;

    if (customerId) {
      customerFilter = `AND so.customer_id = $${paramIndex}`;
      queryParams.push(customerId);
      paramIndex++;
    }

    if (status) {
      statusFilter = `AND so.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    const salesQuery = `
      SELECT 
        so.order_number,
        i.invoice_number,
        c.name as customer_name,
        so.order_date,
        so.due_date,
        so.status,
        so.subtotal,
        so.tax_amount,
        so.discount_amount,
        so.total_amount,
        COALESCE(i.paid_amount, 0) as paid_amount,
        (so.total_amount - COALESCE(i.paid_amount, 0)) as outstanding_amount
      FROM sales_orders so
      INNER JOIN customers c ON so.customer_id = c.id
      LEFT JOIN invoices i ON so.id = i.sales_order_id
      WHERE so.order_date BETWEEN $1 AND $2
        ${customerFilter}
        ${statusFilter}
      ORDER BY so.order_date DESC, so.order_number
    `;

    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT so.id) as total_orders,
        COUNT(DISTINCT i.id) as total_invoices,
        COALESCE(SUM(so.total_amount), 0) as total_sales,
        COALESCE(SUM(i.paid_amount), 0) as total_paid,
        COALESCE(SUM(so.total_amount - COALESCE(i.paid_amount, 0)), 0) as total_outstanding,
        COALESCE(AVG(so.total_amount), 0) as average_order_value
      FROM sales_orders so
      INNER JOIN customers c ON so.customer_id = c.id
      LEFT JOIN invoices i ON so.id = i.sales_order_id
      WHERE so.order_date BETWEEN $1 AND $2
        ${customerFilter}
        ${statusFilter}
    `;

    const byCustomerQuery = `
      SELECT 
        c.id as customer_id,
        c.name as customer_name,
        COUNT(so.id) as total_orders,
        COALESCE(SUM(so.total_amount), 0) as total_amount,
        COALESCE(SUM(i.paid_amount), 0) as paid_amount,
        COALESCE(SUM(so.total_amount - COALESCE(i.paid_amount, 0)), 0) as outstanding_amount
      FROM customers c
      INNER JOIN sales_orders so ON c.id = so.customer_id
      LEFT JOIN invoices i ON so.id = i.sales_order_id
      WHERE so.order_date BETWEEN $1 AND $2
        ${customerFilter}
        ${statusFilter}
      GROUP BY c.id, c.name
      ORDER BY total_amount DESC
    `;

    const byProductQuery = `
      SELECT 
        soi.product_id,
        soi.product_sku,
        soi.product_name,
        SUM(soi.quantity) as total_quantity,
        SUM(soi.line_total) as total_revenue,
        AVG(soi.unit_price) as average_price
      FROM sales_order_items soi
      INNER JOIN sales_orders so ON soi.sales_order_id = so.id
      INNER JOIN customers c ON so.customer_id = c.id
      WHERE so.order_date BETWEEN $1 AND $2
        ${customerFilter}
        ${statusFilter}
      GROUP BY soi.product_id, soi.product_sku, soi.product_name
      ORDER BY total_revenue DESC
    `;

    const [salesResult, summaryResult, byCustomerResult, byProductResult] = await Promise.all([
      salesDB.rawQueryAll(salesQuery, ...queryParams),
      salesDB.rawQueryAll(summaryQuery, ...queryParams),
      salesDB.rawQueryAll(byCustomerQuery, ...queryParams),
      salesDB.rawQueryAll(byProductQuery, ...queryParams)
    ]);

    const items: SalesReportItem[] = salesResult.map(row => ({
      orderNumber: row.order_number,
      invoiceNumber: row.invoice_number,
      customerName: row.customer_name,
      orderDate: row.order_date,
      dueDate: row.due_date,
      status: row.status,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      discountAmount: parseFloat(row.discount_amount),
      totalAmount: parseFloat(row.total_amount),
      paidAmount: parseFloat(row.paid_amount),
      outstandingAmount: parseFloat(row.outstanding_amount)
    }));

    const summary: SalesReportSummary = {
      totalOrders: parseInt(summaryResult[0]?.total_orders || 0),
      totalInvoices: parseInt(summaryResult[0]?.total_invoices || 0),
      totalSales: parseFloat(summaryResult[0]?.total_sales || 0),
      totalPaid: parseFloat(summaryResult[0]?.total_paid || 0),
      totalOutstanding: parseFloat(summaryResult[0]?.total_outstanding || 0),
      averageOrderValue: parseFloat(summaryResult[0]?.average_order_value || 0)
    };

    const byCustomer: SalesReportByCustomer[] = byCustomerResult.map(row => ({
      customerId: parseInt(row.customer_id),
      customerName: row.customer_name,
      totalOrders: parseInt(row.total_orders),
      totalAmount: parseFloat(row.total_amount),
      paidAmount: parseFloat(row.paid_amount),
      outstandingAmount: parseFloat(row.outstanding_amount)
    }));

    const byProduct: SalesReportByProduct[] = byProductResult.map(row => ({
      productId: parseInt(row.product_id),
      productSku: row.product_sku,
      productName: row.product_name,
      totalQuantity: parseInt(row.total_quantity),
      totalRevenue: parseFloat(row.total_revenue),
      averagePrice: parseFloat(row.average_price)
    }));

    return {
      summary,
      items,
      byCustomer,
      byProduct,
      periode: {
        startDate,
        endDate
      }
    };
  }
);