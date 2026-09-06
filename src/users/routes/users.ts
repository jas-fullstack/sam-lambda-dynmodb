import { Router } from "express";
import { getUserById } from "../handlers/getUserById";
import { listUsers } from "../handlers/listUsers";

export const usersRouter = Router();

usersRouter.get("/", listUsers);
usersRouter.get("/:id", getUserById);
