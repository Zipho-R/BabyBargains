const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
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
    quantityOnHand: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: 0
    }
  },
  { timestamps: true }
);

inventorySchema.index({ branchId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);