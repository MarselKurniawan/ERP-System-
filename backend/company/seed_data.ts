import { api } from "encore.dev/api";
import { companyDB } from "./db";

// Seeds the database with sample company data.
export const seedCompanies = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/companies/seed" },
  async () => {
    const companies = [
      {
        name: "Acme Corporation",
        address: "123 Business St, Jakarta, Indonesia",
        phone: "+62-21-1234567",
        email: "info@acme.com",
        taxId: "01.234.567.8-901.000",
        currency: "IDR",
        fiscalYearStart: 1
      },
      {
        name: "Tech Solutions Ltd",
        address: "456 Innovation Ave, Surabaya, Indonesia",
        phone: "+62-31-7654321",
        email: "contact@techsolutions.com",
        taxId: "02.345.678.9-012.000",
        currency: "USD",
        fiscalYearStart: 4
      },
      {
        name: "Global Trading Co",
        address: "789 Commerce Blvd, Bandung, Indonesia",
        phone: "+62-22-9876543",
        email: "sales@globaltrading.com",
        taxId: "03.456.789.0-123.000",
        currency: "IDR",
        fiscalYearStart: 1
      }
    ];

    for (const company of companies) {
      // Check if company already exists
      const existingCompany = await companyDB.queryRow`
        SELECT id FROM companies WHERE name = ${company.name}
      `;

      if (!existingCompany) {
        const newCompany = await companyDB.queryRow<{ id: number }>`
          INSERT INTO companies (name, address, phone, email, tax_id)
          VALUES (${company.name}, ${company.address}, ${company.phone}, ${company.email}, ${company.taxId})
          RETURNING id
        `;

        if (newCompany) {
          await companyDB.exec`
            INSERT INTO company_settings (company_id, currency, fiscal_year_start)
            VALUES (${newCompany.id}, ${company.currency}, ${company.fiscalYearStart})
          `;
        }
      }
    }

    return { message: "Sample companies created successfully" };
  }
);
