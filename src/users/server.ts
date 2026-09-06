import cors from "cors";
import express from "express";
import { usersRouter } from "./routes/users";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/users", usersRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  return app;
};
