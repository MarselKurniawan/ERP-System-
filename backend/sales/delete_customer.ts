import { api, APIError } from "encore.dev/api";
import { salesDB } from "./db";

// Deletes a customer.
export const deleteCustomer = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/customers/:id" },
  async (req) => {
    const result = await salesDB.exec`
      DELETE FROM customers WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Customer not found");
    }
  }
);
