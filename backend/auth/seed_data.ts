import { api } from "encore.dev/api";
import { authDB } from "./db";

// Seeds the database with sample user data.
export const seedUsers = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/auth/seed" },
  async () => {
    const users = [
      { email: "admin@company.com", password: "admin123", firstName: "Admin", lastName: "User", role: "admin" },
      { email: "manager@company.com", password: "manager123", firstName: "Manager", lastName: "User", role: "manager" },
      { email: "accountant@company.com", password: "accountant123", firstName: "John", lastName: "Accountant", role: "accountant" },
      { email: "sales@company.com", password: "sales123", firstName: "Jane", lastName: "Sales", role: "sales" },
      { email: "purchasing@company.com", password: "purchasing123", firstName: "Mike", lastName: "Purchasing", role: "purchasing" },
      { email: "user@company.com", password: "user123", firstName: "Regular", lastName: "User", role: "user" },
    ];

    for (const user of users) {
      const passwordHash = `hashed_${user.password}`;
      
      // Check if user already exists
      const existingUser = await authDB.queryRow`
        SELECT id FROM users WHERE email = ${user.email}
      `;

      if (!existingUser) {
        await authDB.exec`
          INSERT INTO users (email, password_hash, first_name, last_name, role)
          VALUES (${user.email}, ${passwordHash}, ${user.firstName}, ${user.lastName}, ${user.role})
        `;
      }
    }

    return { message: "Sample users created successfully" };
  }
);
