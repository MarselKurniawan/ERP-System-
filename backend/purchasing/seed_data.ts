import { api } from "encore.dev/api";
import { purchasingDB } from "./db";

// Seeds the database with sample purchasing data.
export const seedPurchasing = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/purchasing/seed" },
  async () => {
    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
      const suppliers = [
      {
        name: "PT Elektronik Nusantara",
        email: "sales@elektroniknusantara.com",
        phone: "+62-21-1234567",
        address: "Jl. Industri No. 123, Jakarta Timur",
        taxId: "01.111.222.3-444.000",
        paymentTerms: "Net 30"
      },
      {
        name: "CV Furniture Indonesia",
        email: "info@furnitureindonesia.com",
        phone: "+62-31-7654321",
        address: "Jl. Kayu Manis No. 456, Surabaya",
        taxId: "02.222.333.4-555.000",
        paymentTerms: "Net 45"
      },
      {
        name: "UD Kertas Sejahtera",
        email: "order@kertassejahtera.com",
        phone: "+62-22-9876543",
        address: "Jl. Industri Kertas No. 789, Bandung",
        taxId: "03.333.444.5-666.000",
        paymentTerms: "Net 15"
      },
      {
        name: "PT Software Global",
        email: "licensing@softwareglobal.com",
        phone: "+62-274-1112233",
        address: "Jl. IT Center No. 321, Yogyakarta",
        taxId: "04.444.555.6-777.000",
        paymentTerms: "Net 30"
      },
      {
        name: "CV Hardware Komputer",
        email: "wholesale@hardwarekomputer.com",
        phone: "+62-361-4445566",
        address: "Jl. Teknologi No. 654, Denpasar",
        taxId: "05.555.666.7-888.000",
        paymentTerms: "Net 30"
      }
      ];

      const supplierIds: number[] = [];

      for (const supplier of suppliers) {
        const existingSupplier = await purchasingDB.queryRow<{ id: number }>`
          SELECT id FROM suppliers WHERE name = ${supplier.name} AND company_id = ${companyId}
        `;

        if (!existingSupplier) {
          const newSupplier = await purchasingDB.queryRow<{ id: number }>`
            INSERT INTO suppliers (name, email, phone, address, tax_id, payment_terms, company_id)
            VALUES (${supplier.name}, ${supplier.email}, ${supplier.phone}, ${supplier.address}, ${supplier.taxId}, ${supplier.paymentTerms}, ${companyId})
            RETURNING id
          `;
          supplierIds.push(newSupplier!.id);
        } else {
          supplierIds.push(existingSupplier.id);
        }
      }

      const purchaseOrders = [
        {
          supplierId: supplierIds[0],
          orderDate: new Date('2024-01-10'),
          expectedDate: new Date('2024-01-25'),
          status: 'confirmed',
          items: [
            { productSku: `LAPTOP001-C${companyId}`, productName: 'Business Laptop', quantity: 20, unitPrice: 12000000 },
            { productSku: `MONITOR001-C${companyId}`, productName: '24-inch Monitor', quantity: 15, unitPrice: 2800000 }
          ],
          taxRate: 11,
          discountAmount: 5000000,
          notes: 'Quarterly electronics procurement'
        },
        {
          supplierId: supplierIds[1],
          orderDate: new Date('2024-01-12'),
          expectedDate: new Date('2024-02-01'),
          status: 'received',
          items: [
            { productSku: `CHAIR001-C${companyId}`, productName: 'Office Chair', quantity: 25, unitPrice: 1800000 },
            { productSku: `DESK001-C${companyId}`, productName: 'Office Desk', quantity: 20, unitPrice: 2200000 }
          ],
          taxRate: 11,
          discountAmount: 3000000,
          notes: 'Office furniture restocking'
        },
        {
          supplierId: supplierIds[2],
          orderDate: new Date('2024-01-18'),
          expectedDate: new Date('2024-01-30'),
          status: 'sent',
          items: [
            { productSku: `PAPER001-C${companyId}`, productName: 'A4 Paper', quantity: 100, unitPrice: 55000 }
          ],
          taxRate: 11,
          discountAmount: 500000,
          notes: 'Monthly paper supply'
        },
        {
          supplierId: supplierIds[4],
          orderDate: new Date('2024-01-22'),
          status: 'draft',
          items: [
            { productSku: `MOUSE001-C${companyId}`, productName: 'Wireless Mouse', quantity: 50, unitPrice: 180000 }
          ],
          taxRate: 11,
          discountAmount: 0,
          notes: 'Hardware accessories order'
        }
      ];

      for (const order of purchaseOrders) {
        const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        let subtotal = 0;
        for (const item of order.items) {
          subtotal += item.quantity * item.unitPrice;
        }

        const taxAmount = subtotal * (order.taxRate || 0) / 100;
        const totalAmount = subtotal + taxAmount - (order.discountAmount || 0);

        const newOrder = await purchasingDB.queryRow<{ id: number }>`
          INSERT INTO purchase_orders (order_number, supplier_id, company_id, order_date, expected_date, status, subtotal, tax_amount, discount_amount, total_amount, notes)
          VALUES (${orderNumber}, ${order.supplierId}, ${companyId}, ${order.orderDate}, ${order.expectedDate || null}, ${order.status}, ${subtotal}, ${taxAmount}, ${order.discountAmount || 0}, ${totalAmount}, ${order.notes || null})
          RETURNING id
        `;

        if (newOrder) {
          for (const item of order.items) {
            const lineTotal = item.quantity * item.unitPrice;
            await purchasingDB.exec`
              INSERT INTO purchase_order_items (purchase_order_id, product_id, product_sku, product_name, quantity, unit_price, discount_amount, line_total)
              VALUES (${newOrder.id}, 1, ${item.productSku}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, 0, ${lineTotal})
            `;
          }
        }
      }
    }

    return { message: "Sample purchasing data created successfully" };
  }
);
