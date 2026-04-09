import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL!;

export const db = drizzle(DATABASE_URL, { schema });
