const cors = require("cors");
const express = require("express");
const { usersRouter } = require("./routes/users");

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/users", usersRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  return app;
};

module.exports = { createApp };
