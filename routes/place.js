const express = require("express");
const placeController = require("../controller/place");
const isAuth = require("../middleware/is-auth");
const { body } = require("express-validator/check");
const { Category } = require("../model/category");
const fileUpload = require("../middleware/file-upload");
const isEnabled = require("../middleware/is-enabled");

const router = express.Router();

router.get("/", placeController.getPlaces);
router.get("/:placeId", placeController.getPlaceById);
router.get("/owner/:ownerId", placeController.getPlacesByOwnerId);
router.post(
  "/",
  [
    // body("title")
    //   .trim()
    //   .isLength({ min: 3 })
    //   .withMessage("Titlul trebuie sa contina minimum 3 caractere"),
    // body("suprafata")
    //   .trim()
    //   .isNumeric()
    //   .withMessage("Suprafata trebuie sa fie numerica"),
    // body("tara")
    //   .trim()
    //   .isLength({ min: 1 })
    //   .withMessage("Tara trebuie sa contina minimum 1 caracter"),
    // body("oras")
    //   .trim()
    //   .isLength({ min: 1 })
    //   .withMessage("Orasul trebuie sa contina minimum 1 caracter"),
    // body("strada")
    //   .trim()
    //   .isLength({ min: 1 })
    //   .withMessage("Strada trebuie sa contina minimum 1 caracter"),
    // body("judet")
    //   .trim()
    //   .isLength({ min: 1 })
    //   .withMessage("Judetul trebuie sa contina minimum 1 caracter"),
    // body("categoryId").custom((value, { req } ) => {
     
    //   return Category.findOne({ _id: value }).then((categoryDoc) => {
    //     if (!categoryDoc) {
    //       return Promise.reject("Aceasta categorie nu exista!");
    //     }
    //   });
    // }),
    // body("image").notEmpty().withMessage("image is required")
  ],
  isAuth,
  isEnabled,
  fileUpload.fields([{name: 'image', maxCount: 12}, {name: 'docs', maxCount: 12} ]),
  placeController.addPlace
);
router.patch(
  "/:placeId",
  [
    // body("title")
    //   .trim()
    //   .isLength({ min: 3 })
    //   .withMessage("Titlul trebuie sa contina minimum 3 caractere"),
    // body("suprafata")
    //   .trim()
    //   .isNumeric()
    //   .withMessage("Suprafata trebuie sa fie numerica"),
    // body("tara")
    //   .trim()
    //   .isLength({ min: 1 })
    //   .withMessage("Tara trebuie sa contina minimum 1 caracter"),
    // body("oras")
    //   .trim()
    //   .isLength({ min: 1 })
    //   .withMessage("Orasul trebuie sa contina minimum 1 caracter"),
    // body("strada")
    //   .trim()
    //   .isLength({ min: 1 })
    //   .withMessage("Strada trebuie sa contina minimum 1 caracter"),
    // body("judet")
    //   .trim()
    //   .isLength({ min: 1 })
    //   .withMessage("Judetul trebuie sa contina minimum 1 caracter"),
    // body("categoryId").custom((value, { req } ) => {
    //   console.log(value);
    //   return Category.findOne({_id: value }).then((categoryDoc) => {
    //     if (!categoryDoc) {
    //       return Promise.reject("Aceasta categorie nu exista!");
    //     }
    //   });
    // }),
  ],
  isAuth,
  isEnabled,
  fileUpload.fields([{name: 'image', maxCount: 12}, {name: 'docs', maxCount: 12} ]),
  placeController.editPlace
);

router.delete("/:placeId", isAuth, placeController.deletePlace);

router.delete("/image/:imageAndPlaceId", isAuth, placeController.deleteImageByPlaceAndImgId);

module.exports = router;
