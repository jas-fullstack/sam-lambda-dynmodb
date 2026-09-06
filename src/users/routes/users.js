const { Router } = require("express");
const { getUserById } = require("../handlers/getUserById");
const { listUsers } = require("../handlers/listUsers");

const usersRouter = Router();

usersRouter.get("/", listUsers);
usersRouter.get("/:id", getUserById);

module.exports = { usersRouter };
