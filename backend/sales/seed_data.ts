import { api } from "encore.dev/api";
import { salesDB } from "./db";

// Seeds the database with sample sales data.
export const seedSales = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/sales/seed" },
  async () => {
    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
      const customers = [
        {
          name: "PT Maju Jaya",
          email: "purchasing@majujaya.com",
          phone: "+62-21-5551234",
          address: "Jl. Sudirman No. 123, Jakarta Pusat",
          taxId: "01.234.567.8-901.000",
          creditLimit: 50000000
        },
      {
        name: "CV Berkah Sejahtera",
        email: "admin@berkahsejahtera.com",
        phone: "+62-31-7778888",
        address: "Jl. Pemuda No. 456, Surabaya",
        taxId: "02.345.678.9-012.000",
        creditLimit: 25000000
      },
      {
        name: "UD Sumber Rezeki",
        email: "info@sumberrezeki.com",
        phone: "+62-22-9990000",
        address: "Jl. Asia Afrika No. 789, Bandung",
        taxId: "03.456.789.0-123.000",
        creditLimit: 15000000
      },
      {
        name: "PT Digital Solutions",
        email: "procurement@digitalsolutions.com",
        phone: "+62-274-1112222",
        address: "Jl. Malioboro No. 321, Yogyakarta",
        taxId: "04.567.890.1-234.000",
        creditLimit: 75000000
      },
      {
        name: "CV Mandiri Elektronik",
        email: "sales@mandirielektronik.com",
        phone: "+62-361-3334444",
        address: "Jl. Sunset Road No. 654, Denpasar",
        taxId: "05.678.901.2-345.000",
        creditLimit: 30000000
      }
      ];

      const customerIds: number[] = [];

      for (const customer of customers) {
        const existingCustomer = await salesDB.queryRow<{ id: number }>`
          SELECT id FROM customers WHERE name = ${customer.name} AND company_id = ${companyId}
        `;

        if (!existingCustomer) {
          const newCustomer = await salesDB.queryRow<{ id: number }>`
            INSERT INTO customers (name, email, phone, address, tax_id, credit_limit, company_id)
            VALUES (${customer.name}, ${customer.email}, ${customer.phone}, ${customer.address}, ${customer.taxId}, ${customer.creditLimit}, ${companyId})
            RETURNING id
          `;
          customerIds.push(newCustomer!.id);
        } else {
          customerIds.push(existingCustomer.id);
        }
      }

      const salesOrders = [
        {
          customerId: customerIds[0],
          orderDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          status: 'confirmed',
          items: [
            { productSku: `LAPTOP001-C${companyId}`, productName: 'Business Laptop', quantity: 5, unitPrice: 15000000 },
            { productSku: `MOUSE001-C${companyId}`, productName: 'Wireless Mouse', quantity: 5, unitPrice: 250000 }
          ],
          taxRate: 11,
          discountAmount: 1000000,
          notes: 'Bulk order for new office setup'
        },
        {
          customerId: customerIds[1],
          orderDate: new Date('2024-01-20'),
          dueDate: new Date('2024-02-20'),
          status: 'shipped',
          items: [
            { productSku: `CHAIR001-C${companyId}`, productName: 'Office Chair', quantity: 10, unitPrice: 2500000 },
            { productSku: `DESK001-C${companyId}`, productName: 'Office Desk', quantity: 10, unitPrice: 3000000 }
          ],
          taxRate: 11,
          discountAmount: 2500000,
          notes: 'Office furniture order'
        },
        {
          customerId: customerIds[2],
          orderDate: new Date('2024-01-25'),
          status: 'draft',
          items: [
            { productSku: `PAPER001-C${companyId}`, productName: 'A4 Paper', quantity: 50, unitPrice: 75000 },
            { productSku: `PEN001-C${companyId}`, productName: 'Ballpoint Pen', quantity: 20, unitPrice: 25000 }
          ],
          taxRate: 11,
          discountAmount: 0,
          notes: 'Monthly office supplies order'
        }
      ];

      for (const order of salesOrders) {
        const orderNumber = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        let subtotal = 0;
        for (const item of order.items) {
          subtotal += item.quantity * item.unitPrice;
        }

        const taxAmount = subtotal * (order.taxRate || 0) / 100;
        const totalAmount = subtotal + taxAmount - (order.discountAmount || 0);

        const newOrder = await salesDB.queryRow<{ id: number }>`
          INSERT INTO sales_orders (order_number, customer_id, company_id, order_date, due_date, status, subtotal, tax_amount, discount_amount, total_amount, notes)
          VALUES (${orderNumber}, ${order.customerId}, ${companyId}, ${order.orderDate}, ${order.dueDate || null}, ${order.status}, ${subtotal}, ${taxAmount}, ${order.discountAmount || 0}, ${totalAmount}, ${order.notes || null})
          RETURNING id
        `;

        if (newOrder) {
          for (const item of order.items) {
            const lineTotal = item.quantity * item.unitPrice;
            await salesDB.exec`
              INSERT INTO sales_order_items (sales_order_id, product_id, product_sku, product_name, quantity, unit_price, discount_amount, line_total)
              VALUES (${newOrder.id}, 1, ${item.productSku}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, 0, ${lineTotal})
            `;
          }
        }
      }
    }

    return { message: "Sample sales data created successfully" };
  }
);
