import { SQLDatabase } from "encore.dev/storage/sqldb";

export const accountingDB = new SQLDatabase("accounting", {
  migrations: "./migrations",
});
