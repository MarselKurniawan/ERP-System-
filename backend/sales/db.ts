import { SQLDatabase } from "encore.dev/storage/sqldb";

export const salesDB = new SQLDatabase("sales", {
  migrations: "./migrations",
});
