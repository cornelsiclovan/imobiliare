const { User } = require("../model/user");

module.exports = async (req, res, next) => {
  req.isEnabled = false;

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("This user does not exist!");
      error.statusCode = 400;
      throw error;
    }

    if (user.enabled === '0') {
      const error = new Error("You do not have permisions!");
      error.statusCode = 401;
      throw error;
    }

    req.isEnabled = user.enabled === "1";
  } catch (error) {
    next(error);
  }

  next();
};
