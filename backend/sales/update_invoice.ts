import { api } from "encore.dev/api";
import { salesDB } from "./db";

export interface UpdateInvoiceRequest {
  id: number;
  status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paidAmount?: number;
  notes?: string;
}

export interface UpdateInvoiceResponse {
  id: number;
  invoiceNumber: string;
  status: string;
  paidAmount: number;
}

export const updateInvoice = api(
  { method: "PUT", path: "/invoices/:id", expose: true },
  async (req: UpdateInvoiceRequest): Promise<UpdateInvoiceResponse> => {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (req.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(req.status);
      paramIndex++;
    }

    if (req.paidAmount !== undefined) {
      updates.push(`paid_amount = $${paramIndex}`);
      params.push(req.paidAmount);
      paramIndex++;
    }

    if (req.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(req.notes);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.id);

    const updateQuery = `
      UPDATE invoices 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, invoice_number, status, paid_amount
    `;

    const result = await salesDB.rawQueryRow(updateQuery, ...params);

    return {
      id: result!.id,
      invoiceNumber: result!.invoice_number,
      status: result!.status,
      paidAmount: parseFloat(result!.paid_amount)
    };
  }
);