const { findUserById } = require("../data/users");

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);

    if (!user) {
      res.status(404).json({ message: `User ${id} not found` });
      return;
    }

    res.json({ user }); //
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUserById };
