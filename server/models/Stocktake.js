const mongoose = require("mongoose");

const stocktakeSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    systemQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    physicalQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    difference: {
      type: Number,
      required: true
    },
    stocktakeDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stocktake", stocktakeSchema);