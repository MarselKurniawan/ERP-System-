import { api } from "encore.dev/api";
import { authDB } from "./db";

export const seedUsers = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/auth/seed" },
  async () => {
    const users = [
      { 
        email: "superadmin@erp.com", 
        password: "super123", 
        firstName: "Super", 
        lastName: "Admin", 
        role: "admin",
        companies: "all"
      },
      { 
        email: "user.acme@erp.com", 
        password: "user123", 
        firstName: "User", 
        lastName: "Acme", 
        role: "user",
        companies: [1]
      },
      { 
        email: "purchasing.acme@erp.com", 
        password: "purchasing123", 
        firstName: "Purchasing", 
        lastName: "Acme", 
        role: "purchasing",
        companies: [1]
      },
      { 
        email: "user.tech@erp.com", 
        password: "user123", 
        firstName: "User", 
        lastName: "Tech", 
        role: "user",
        companies: [2]
      },
      { 
        email: "purchasing.tech@erp.com", 
        password: "purchasing123", 
        firstName: "Purchasing", 
        lastName: "Tech", 
        role: "purchasing",
        companies: [2]
      },
      { 
        email: "manager.global@erp.com", 
        password: "manager123", 
        firstName: "Manager", 
        lastName: "Global", 
        role: "manager",
        companies: [3]
      },
    ];

    for (const user of users) {
      const passwordHash = `hashed_${user.password}`;
      
      const existingUser = await authDB.queryRow<{ id: number }>`
        SELECT id FROM users WHERE email = ${user.email}
      `;

      let userId: number;

      if (!existingUser) {
        const newUser = await authDB.queryRow<{ id: number }>`
          INSERT INTO users (email, password_hash, first_name, last_name, role)
          VALUES (${user.email}, ${passwordHash}, ${user.firstName}, ${user.lastName}, ${user.role})
          RETURNING id
        `;
        userId = newUser!.id;
      } else {
        userId = existingUser.id;
      }

      if (user.companies === "all") {
        const companies = [];
        for await (const row of authDB.query<{ id: number }>`
          SELECT id FROM companies
        `) {
          companies.push(row.id);
        }

        for (const companyId of companies) {
          const existingAssignment = await authDB.queryRow`
            SELECT id FROM user_companies WHERE user_id = ${userId} AND company_id = ${companyId}
          `;

          if (!existingAssignment) {
            await authDB.exec`
              INSERT INTO user_companies (user_id, company_id)
              VALUES (${userId}, ${companyId})
            `;
          }
        }
      } else if (Array.isArray(user.companies)) {
        for (const companyId of user.companies) {
          const existingAssignment = await authDB.queryRow`
            SELECT id FROM user_companies WHERE user_id = ${userId} AND company_id = ${companyId}
          `;

          if (!existingAssignment) {
            await authDB.exec`
              INSERT INTO user_companies (user_id, company_id)
              VALUES (${userId}, ${companyId})
            `;
          }
        }
      }
    }

    return { message: "Sample users created successfully" };
  }
);
