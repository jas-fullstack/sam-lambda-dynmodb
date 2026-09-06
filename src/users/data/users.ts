import { User } from "../types";

export const users: User[] = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
  { id: "3", name: "Charlie", email: "charlie@example.com" },
];

export const findUserById = (id: string): User | undefined =>
  users.find((user) => user.id === id);
