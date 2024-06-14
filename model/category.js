const { default: mongoose } = require("mongoose");

const categorySchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  }
});

const Category = mongoose.model("Category", categorySchema);
exports.categorySchema = categorySchema;
exports.Category = Category;
