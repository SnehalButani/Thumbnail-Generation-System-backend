import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import connectDB from "./config/database";
import { setupSocketIO } from "./utils/socket";
import "./services/worker.service";
import userRoutes from "./routes/user.routes";
import uploadRoutes from "./routes/upload.routes";
import {  uploadsDir } from "./utils/path";
import fs from "fs";

const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.IO
setupSocketIO(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/jobs", uploadRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Welcome to the API",
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Worker process started`);
});
