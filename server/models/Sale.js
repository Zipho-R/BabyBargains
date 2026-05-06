const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantitySold: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true
    },

    // Legacy single-item sale fields
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    quantitySold: Number,
    unitPrice: Number,
    totalAmount: Number,

    // New multi-item sale format
    items: {
      type: [saleItemSchema],
      default: []
    },
    totalSaleAmount: {
      type: Number,
      required: true
    },
    saleDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Sale", saleSchema);