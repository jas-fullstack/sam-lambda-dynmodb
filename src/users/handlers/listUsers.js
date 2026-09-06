const { listAllUsers } = require("../data/users");

const listUsers = async (_req, res) => {
  try {
    const users = await listAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listUsers };
