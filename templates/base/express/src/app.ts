import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { router } from "./routes/index.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

// Security
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(router);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
