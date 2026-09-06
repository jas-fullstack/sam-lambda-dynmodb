import { Request, Response } from "express";
import { findUserById } from "../data/users";

export const getUserById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = findUserById(id);

  if (!user) {
    res.status(404).json({ message: `User ${id} not found` });
    return;
  }

  res.json({ user });
};
