const { User } = require("../model/user");

module.exports = async (req, res, next) => {
  req.isAdmin = false;

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("This user does not exist!");
      error.statusCode = 400;
      throw error;
    }

    if (!user.isAdmin) {
      const error = new Error("You do not have permisions!");
      error.statusCode = 401;
      throw error;
    }

    req.isAdmin = user.isAdmin;
  } catch (error) {
    next(error);
  }

  next();
};
