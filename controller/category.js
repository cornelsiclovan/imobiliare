const { Category } = require("../model/category");
const { Place } = require("../model/place");

exports.getCategories = async (req, res, next) => {
  let categories = [];

  try {
    categories = await Category.find();

    res.status(200).send({ categories: categories });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  const categoryId = req.params.categoryId;

  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      const error = new Error("There is not a category with this id!");
      error.statusCode = 401;
      throw error;
    }

    res.status(200).send(category);
  } catch (error) {
    next(error);
  }
};

exports.addCategory = async (req, res, next) => {
  try {
    const existingCategory = await Category.find({ title: req.body.title });

    if (existingCategory[0]) {
      const error = new Error("The category with this title already exists!");
      error.statusCode = 422;
      throw error;
    }

    let category = new Category({ title: req.body.title });
    await category.save();

    res.status(200).send(category);
  } catch (error) {
    next(error);
  }
};

exports.editCategory = async (req, res, next) => {
  const categoryId = req.params.categoryId;

  try {
    const category = await Category.findById(categoryId);
    
    if (!category) {
      const error = new Error("This category does not exist!");
      error.statusCode = 422;
      throw error;
    }

    const place = await Place.find({ category: req.params.categoryId });

    if (place && place.length !== 0) {
      const error = new Error("Cannot modify category because it has places.");
      error.statusCode = 422;
      throw error;
    }

    const oldCategpry = category;

    category.title = req.body.title || oldCategpry.title;
    await category.save();
    res.status(200).send(category);
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  const categoryId = req.params.categoryId;
  try {
    const category = await Category.findById(categoryId);
    
    if (!category) {
      const error = new Error("Could not find category.");
      error.statusCode = 422;
      throw error;
    }

    const place = await Place.find({ category: req.params.categoryId });

    if (place && place.length !== 0) {
      const error = new Error("Cannot delete category because it has places.");
      error.statusCode = 422;
      throw error;
    }


    await Category.deleteOne({ _id: categoryId });

    res.status(200).json({ message: "Deleted category!" });
  } catch (error) {
    next(error);
  }
};
