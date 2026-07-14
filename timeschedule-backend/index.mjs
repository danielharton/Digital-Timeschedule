import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import databaseManager from "./src/utils/database.mjs";

const app = express();

dotenv.config({ path: ".env.local" });
dotenv.config();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Auth-Token"]
  })
);

app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

const bootstrapDatabase = async () => {
  try {
    console.log("Starting database setup...");
    await databaseManager.getKnex();
    console.log("Database connected");

    if (!process.env.SKIP_MIGRATIONS) {
      await databaseManager.runMigrations();
      await databaseManager.runSeeds();
      console.log("Migrations and seeds completed");
    } else {
      console.log("SKIP_MIGRATIONS enabled");
    }
  } catch (error) {
    console.error("Database bootstrap failed:", error.message);
  }
};

await bootstrapDatabase();

const { default: apiRoute } = await import("./src/routes/apiRoute.mjs");
app.use("/api", apiRoute);

app.get("/health", async (_req, res) => {
  const health = await databaseManager.healthCheck();
  res.status(health.connected ? 200 : 503).json(health);
});

app.get("/", (_req, res) => {
  res.json({
    name: "TimeSchedule API",
    status: "running",
    endpoints: {
      health: "/health",
      api: "/api/*"
    }
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    data: null
  });
});

export default app;
