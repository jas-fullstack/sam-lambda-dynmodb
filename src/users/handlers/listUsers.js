const { users } = require("../data/users");

const listUsers = (_req, res) => {
  res.json({ users });
};

module.exports = { listUsers };
