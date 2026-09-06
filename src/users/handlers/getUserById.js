const { findUserById } = require("../data/users");

const getUserById = (req, res) => {
  const { id } = req.params;
  const user = findUserById(id);

  if (!user) {
    res.status(404).json({ message: `User ${id} not found` });
    return;
  }

  res.json({ user });
};

module.exports = { getUserById };
