const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    supplierCode: {
      type: String,
      default: null,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);