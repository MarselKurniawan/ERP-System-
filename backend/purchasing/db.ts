import { SQLDatabase } from "encore.dev/storage/sqldb";

export const purchasingDB = new SQLDatabase("purchasing", {
  migrations: "./migrations",
});
