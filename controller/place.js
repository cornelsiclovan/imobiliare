const { validationResult } = require("express-validator");
const { Category } = require("../model/category");
const { Place } = require("../model/place");
const { User } = require("../model/user");
const { default: mongoose } = require("mongoose");
const { Sale } = require("../model/sales");

exports.getPlaces = async (req, res, next) => {
  let places = [];
  let queryObject = {};
  let page = +req.query.page || 1;
  let itemsPerPage = +req.query.itemsperpage || 2;

  let placesBookedOnThatPeriod = [];

  let users = await User.find();
  let disabledUserIds = [];

  users.forEach((user) => {
    if (user.enabled !== "1") disabledUserIds.push(user._id);
  });

  if (req.query.data_start && req.query.data_end) {
    const sales = await Sale.find();

    sales.forEach((sale) => {
      const ds = new Date(sale.data_start);
      const de = new Date(sale.data_end);
      const ds_req = new Date(req.query.data_start);
      const de_req = new Date(req.query.data_end);

      if (
        (ds_req.getTime() <= ds.getTime() && de_req.getTime() > de.getTime()) ||
        (ds_req.getTime() <= ds.getTime() &&
          de_req.getTime() < de.getTime() &&
          de_req.getTime() > ds.getTime()) ||
        (ds_req.getTime() >= ds.getTime() &&
          ds_req.getTime() < de.getTime() &&
          de_req.getTime() > ds.getTime())
      ) {
        placesBookedOnThatPeriod.push(sale.place._id);
      }
    });
  }

  queryObject._id = { $nin: placesBookedOnThatPeriod };
  queryObject.owner = { $nin: disabledUserIds };

  try {
    if (req.query.oras) {
      queryObject.oras = req.query.oras;
    }

    if (req.query.category) {
      queryObject.category = req.query.category;
    }

    if (req.query.tara) {
      queryObject.tara = req.query.tara;
    }

    let count = await Place.countDocuments(queryObject);

    places = await Place.find(queryObject)
      .limit(itemsPerPage)
      .skip(itemsPerPage * (page - 1));

    let owner;
    let category;

    //let placesBookedOnThatPeriod = [];

    let placesToSend = await Promise.all(
      places.map(async (place) => {
        let rating = 0;
        const salesForRating = await Sale.find({ place: place._id });

        salesForRating.map((sale) => {
          if (sale.rating) rating = rating + sale.rating;
        });

        if (salesForRating.length > 0) {
          rating = Math.round(rating / salesForRating.length);
        }

        // test start date in between
        // if (req.query.data_start && req.query.data_end) {
        //   const sales = await Sale.find({ place: place._id });

        //   sales.forEach((sale) => {
        //     const ds = new Date(sale.data_start);
        //     const de = new Date(sale.data_end);
        //     const ds_req = new Date(req.query.data_start);
        //     const de_req = new Date(req.query.data_end);

        //     if (
        //       (ds_req.getTime() <= ds.getTime() &&
        //         de_req.getTime() > de.getTime()) ||
        //       (ds_req.getTime() <= ds.getTime() &&
        //         de_req.getTime() < de.getTime() &&
        //         de_req.getTime() > ds.getTime()) ||
        //       (ds_req.getTime() >= ds.getTime() &&
        //         ds_req.getTime() < de.getTime() &&
        //         de_req.getTime() > ds.getTime())
        //     ) {
        //       placesBookedOnThatPeriod.push(place._id);
        //     }
        //   });
        // }

        // test end date in between

        let thisOwner;
        let thisEnabled;

        await User.findById(place.owner).then((data) => {
          (thisOwner = data.name), (thisEnabled = data.enabled);
        });

        category = await Category.findById(place.category);

        return {
          _id: place._id,
          title: place.title,
          suprafata: place.suprafata,
          tara: place.tara,
          oras: place.oras,
          judet: place.judet,
          strada: place.strada,
          price: place.price || "",
          currency: place.currency || "",
          category: category.title,
          image: place.image,
          owner: thisOwner,
          ownerEnabled: thisEnabled,
          rating: rating,
        };
      })
    );

    let filteredPlacesToSend = [];
    placesToSend.forEach((place) => {
      if (
        placesBookedOnThatPeriod.includes(place._id) ||
        place.ownerEnabled === "0"
      ) {
        count = count - 1;
      } else {
        filteredPlacesToSend.push(place);
      }
    });

    res.status(200).send({ places: filteredPlacesToSend, totalItems: count });
  } catch (error) {
    next(error);
  }
};

exports.getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;

  try {
    const place = await Place.findById(placeId);

    if (!place) {
      const error = new Error("There is no place for this id");
      error.statusCode = 401;
      throw error;
    }

    const owner = await User.findById(place.owner);
    const category = await Category.findById(place.category);

    let placeToSend;

    if (owner.enabled === "0") {
      const error = "You do not have permissions!";
      error.statusCode = "422";
      throw error;
    } else {
      placeToSend = {
        _id: place._id,
        title: place.title,
        suprafata: place.suprafata,
        tara: place.tara,
        oras: place.oras,
        judet: place.judet,
        strada: place.strada,
        price: place.price || "",
        currency: place.currency || "",
        category: category,
        image: place.image,
        owner: { name: owner.name, id: owner._id },
      };
    }

    res.status(200).send({ place: placeToSend });
  } catch (error) {
    next(error);
  }
};

exports.addPlace = async (req, res, next) => {
  //const errors = validationResult(req);

  let picsArray = [];
  let docsArray = [];
  let docsNameArray = [];

  try {
    let errors = [];

    if (!req.body.title) {
      const error = new Error("Proprietatea trebuie sa aiba titlu");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.suprafata && !Number.isInteger(req.body.suprafata)) {
      const error = new Error(
        "Proprietatea trebuie sa aiba suprafata si aceasta valoare sa fie numar intreg"
      );
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.tara) {
      const error = new Error("Proprietatea trebuie sa aiba tara");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.oras) {
      const error = new Error("Proprietatea trebuie sa aiba oras");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.strada) {
      const error = new Error("Proprietatea trebuie sa aiba strada");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.judet) {
      const error = new Error("Proprietatea trebuie sa aiba judet");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.price) {
      const error = new Error("Proprietatea trebuie sa aiba pret");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.currency) {
      const error = new Error("Tipul de valuta trebuie introdus");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.categoryId) {
      const error = new Error("Proprietatea trebuie sa aiba categorie");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.files["image"]) {
      const error = new Error("Proprietatea trebuie sa aiba macar o imagine");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (errors.length !== 0) {
      const error = new Error("Adaugare proprietate esuata");
      error.statusCode = 401;
      error.data = errors;

      throw error;
    }

    req.files["image"].map((file) => {
      picsArray.push(file.path);
    });

    if (req.files["docs"]) {
      req.files["docs"].map((file) => {
        docsNameArray.push(file.originalname);
        docsArray.push(file.path);
      });
    }

    let place = new Place({
      title: req.body.title,
      suprafata: req.body.suprafata,
      tara: req.body.tara,
      oras: req.body.oras,
      strada: req.body.strada,
      judet: req.body.judet,
      price: req.body.price,
      currency: req.body.currency,
      category: { _id: req.body.categoryId },
      owner: req.userId,
      image: picsArray,
      docs: docsArray,
      docNames: docsNameArray,
    });
    await place.save();

    res.status(200).send(place);
  } catch (error) {
    next(error);
  }
};

exports.editPlace = async (req, res, next) => {
  const placeId = req.params.placeId;
  const errors = validationResult(req);

  let picsArray = [];
  let docsArray = [];
  let docsNameArray = [];

  try {
    const place = await Place.findById(placeId);
    const oldPlace = place;

    picsArray = place.image;

    let errors = [];

    if (!req.body.title) {
      const error = new Error("Proprietatea trebuie sa aiba titlu");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.suprafata && !Number.isInteger(req.body.suprafata)) {
      const error = new Error(
        "Proprietatea trebuie sa aiba suprafata si aceasta valoare sa fie numar intreg"
      );
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.tara) {
      const error = new Error("Proprietatea trebuie sa aiba tara");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.oras) {
      const error = new Error("Proprietatea trebuie sa aiba oras");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.strada) {
      const error = new Error("Proprietatea trebuie sa aiba strada");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.judet) {
      const error = new Error("Proprietatea trebuie sa aiba judet");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.price) {
      const error = new Error("Proprietatea trebuie sa aiba pret");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.currency) {
      const error = new Error("Tipul de valuta trebuie introdus");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (!req.body.categoryId) {
      const error = new Error("Proprietatea trebuie sa aiba categorie");
      error.statusCode = 422;
      errors.push(error.message);
    }

    if (place.image.length > 0) {
    } else {
      if (!req.files["image"]) {
        const error = new Error("Proprietatea trebuie sa aiba macar o imagine");
        error.statusCode = 422;
        errors.push(error.message);
      }
    }

    if (errors.length !== 0) {
      const error = new Error("Adaugare proprietate esuata");
      error.statusCode = 401;
      error.data = errors;

      throw error;
    }

    if (req.files["image"]) {
      req.files["image"].map((file) => {
        picsArray.push(file.path);
      });
    }

    if (req.files["docs"]) {
      req.files["docs"].map((file) => {
        docsNameArray.push(file.originalname);
        docsArray.push(file.path);
      });
    }

    const category = await Category.findById(req.body.categoryId);

    place.category = { _id: category._id } || oldPlace.category;
    place.title = req.body.title || oldPlace.title;
    place.suprafata = req.body.suprafata || oldPlace.suprafata;
    place.tara = req.body.tara || oldPlace.tara;
    place.oras = req.body.oras || oldPlace.oras;
    place.strada = req.body.strada || oldPlace.strada;
    place.judet = req.body.judet || oldPlace.judet;
    place.price = req.body.price || oldPlace.price;
    place.currency = req.body.currency || oldPlace.currency;
    place.image = picsArray || oldPlace.image;

    await place.save();

    res.status(200).send(place);
  } catch (error) {
    next(error);
  }
};

exports.deleteImageByPlaceAndImgId = async (req, res, next) => {
  const imageAndPlaceId = req.params.imageAndPlaceId;

  const place = await Place.findById(imageAndPlaceId.split("separator")[1]);

  let newImages = place.image.filter(
    (img) => img !== "uploads\\images\\" + imageAndPlaceId.split("separator")[0]
  );

  place.image = newImages;

  place.save();

  imageAndPlaceId.split("separator");

  res.status(200).send({ message: "bine" });
};

exports.deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;

  try {
    const place = await Place.findById(placeId);

    if (!place) {
      const error = new Error("Could not find place.");
      error.statusCode = 422;
      throw error;
    }

    if (place.owner._id.toString() !== req.userId) {
      const error = new Error("Not authorized!");
      error.statusCode = 422;
      throw error;
    }

    await Place.deleteOne({ _id: placeId });

    res.status(200).json({ message: "Deleted property!" });
  } catch (error) {
    next(error);
  }
};

exports.getPlacesByOwnerId = async (req, res, next) => {
  try {
    const ownerId = req.params.ownerId;
    const place = await Place.find({ owner: ownerId });

    res.status(200).send({ place });
  } catch (err) {
    next(err);
  }
};
