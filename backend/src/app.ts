import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { moodRouter } from "./routes/mood.routes.js";
import { reminderRouter } from "./routes/reminder.routes.js";
import { userRouter } from "./routes/user.routes.js";

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "animo-api" }));
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/moods", moodRouter);
app.use("/api/reminders", reminderRouter);
app.use("/api/users", userRouter);
