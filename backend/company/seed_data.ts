import { api } from "encore.dev/api";
import { companyDB } from "./db";

// Seeds the database with sample company data.
export const seedCompanies = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/companies/seed" },
  async () => {
    const companies = [
      {
        name: "PT Acme Indonesia",
        address: "Jl. Sudirman No. 123, Jakarta Selatan 12190",
        phone: "+62-21-5551234",
        email: "info@acme.co.id",
        taxId: "01.234.567.8-901.000",
        industry: "Manufacturing",
        currency: "IDR",
        fiscalYearStart: 1
      },
      {
        name: "PT Tech Solutions",
        address: "Jl. Gatot Subroto No. 456, Surabaya 60271",
        phone: "+62-31-7778899",
        email: "contact@techsolutions.co.id",
        taxId: "02.345.678.9-012.000",
        industry: "Technology",
        currency: "IDR",
        fiscalYearStart: 1
      },
      {
        name: "CV Global Trading",
        address: "Jl. Asia Afrika No. 789, Bandung 40111",
        phone: "+62-22-4445566",
        email: "sales@globaltrading.co.id",
        taxId: "03.456.789.0-123.000",
        industry: "Trading",
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
          INSERT INTO companies (name, address, phone, email, tax_id, industry)
          VALUES (${company.name}, ${company.address}, ${company.phone}, ${company.email}, ${company.taxId}, ${company.industry})
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
