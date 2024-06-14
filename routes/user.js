const express = require("express");
const userController = require("../controller/user");
const isAuth = require("../middleware/is-auth");
const isAdmin = require("../middleware/is-admin");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

router.get("/", isAuth, isAdmin, userController.getUsers);

router.get("/me", isAuth, userController.getMe);

router.patch(
  "/me",
  isAuth,
  fileUpload.fields([
    { name: "image", maxCount: 12 },
    { name: "docs", maxCount: 12 },
  ]),
  userController.editUser
);

router.patch("/:userId", isAuth, isAdmin, userController.blockUnblockUser);

module.exports = router;
