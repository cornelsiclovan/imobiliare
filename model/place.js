const { default: mongoose } = require("mongoose");
const { categorySchema } = require("./category");

const placeSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  suprafata: {
    type: String,
    required: true,
  },
  tara: {
    type: String,
    required: true,
  },
  oras: {
    type: String,
    required: true,
  },
  judet: {
    type: String,
    required: true,
  },
  strada: {
    type: String,
    required: true,
  },
  numar: {
    type: String,
    required: false,
  },
  apartament: {
    type: String,
    required: false,
  },
  status: {
    type: String,
  },
  category: {
    type: mongoose.Types.ObjectId,
    require: true,
    ref: "Category",
  },
  owner: {
    type: mongoose.Types.ObjectId,
    require: true,
    ref: "User",
  },
  image: {
    type: [String],
  },
  docs: {
    type: [String]
  },
  docNames: {
    type: [String]
  },
  price: {
    type: [String]
  },
  currency: {
    type: [String]
  }
});

const Place = mongoose.model("Place", placeSchema);

exports.Place = Place;
