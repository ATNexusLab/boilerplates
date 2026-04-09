import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    // TODO: Configure your database
    // See: https://www.better-auth.com/docs/databases
  },
  emailAndPassword: {
    enabled: true,
  },
});
