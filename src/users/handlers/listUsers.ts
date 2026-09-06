import { Request, Response } from "express";
import { users } from "../data/users";

export const listUsers = (_req: Request, res: Response): void => {
  res.json({ users });
};
