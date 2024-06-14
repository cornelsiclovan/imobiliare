const isAuth = require("../middleware/is-auth");
const saleController = require("../controller/sale");
const express = require("express");
const { body } = require("express-validator/check");

const router = express.Router();

router.post(
  "/",
  isAuth,
  [
    body("data_start")
      .isLength({ min: 3 })
      .withMessage("Data start nu poate fi gol"),
    body("data_end")
      .isLength({ min: 3 })
      .withMessage("Data end nu poate fi gol"),
    body("nume")
      .isLength({ min: 3 })
      .withMessage("Name can't be empty! Minim 3 characters."),
    body("adresa")
      .isLength({ min: 3 })
      .withMessage("Adress can't be empty! Minim 3 characters."),
    body("telefon")
      .isLength({ min: 3 })
      .withMessage("Phone number can't be empty! Minim 3 digits."),
    body("pay_type")
      .isLength({ min: 1 })
      .withMessage("Please select payment type"),
  ],
  saleController.addSale
);

router.get("/", isAuth, saleController.getSalesByUserId);

router.get("/clients", isAuth, saleController.getClientsByOwnerId);

router.put(
  "/:saleId",
  [
    body("rating")
      .isInt({ min:0, max: 5})
      .withMessage("valoarea minima este 0 si valoarea maxima este 5"),
  ],
  isAuth,
  saleController.rateSale
);

router.put(
  "/:saleId/comment",
  [
    body("comment")
      .isLength({ min: 3})
      .withMessage("Commentul trebuie sa contina minimum 3 caractere"),
  ],
  isAuth,
  saleController.giveComment
)

router.post("/payment", saleController.postPayment);

module.exports = router;
