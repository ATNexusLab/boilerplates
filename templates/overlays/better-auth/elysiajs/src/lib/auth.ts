import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    // Configure your database provider:
    //
    // PostgreSQL (recommended):
    //   url: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/mydb",
    //   type: "pg",
    //
    // MySQL:
    //   url: process.env.DATABASE_URL ?? "mysql://user:password@localhost:3306/mydb",
    //   type: "mysql",
    //
    // SQLite:
    //   url: "./sqlite.db",
    //   type: "sqlite",
    //
    // Docs: https://www.better-auth.com/docs/databases
  },
  emailAndPassword: {
    enabled: true,
  },
});
