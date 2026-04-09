import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    // TODO: Configure your database
  },
  emailAndPassword: {
    enabled: true,
  },
});
