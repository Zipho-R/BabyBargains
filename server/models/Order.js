const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantityOrdered: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true
    },
    supplierName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Pending", "Received", "Cancelled"],
      default: "Pending"
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one order item is required"
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);