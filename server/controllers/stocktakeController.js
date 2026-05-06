const Stocktake = require("../models/Stocktake");
const Inventory = require("../models/Inventory");
const Branch = require("../models/Branch");
const Product = require("../models/Product");

// Get all stocktake records
const getStocktakes = async (req, res) => {
  try {
    const stocktakes = await Stocktake.find()
      .populate("branchId", "branchName location")
      .populate("productId", "productName category sku price")
      .sort({ createdAt: -1 });

    res.status(200).json(stocktakes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stocktakes", error: error.message });
  }
};

// Create stocktake record
const createStocktake = async (req, res) => {
  try {
    const { branchId, productId, physicalQuantity } = req.body;

    if (!branchId || !productId || physicalQuantity === undefined) {
      return res.status(400).json({
        message: "branchId, productId, and physicalQuantity are required"
      });
    }

    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const inventoryRecord = await Inventory.findOne({ branchId, productId });
    if (!inventoryRecord) {
      return res.status(404).json({
        message: "No inventory record found for this product in this branch"
      });
    }

    const systemQuantity = inventoryRecord.quantityOnHand;
    const difference = physicalQuantity - systemQuantity;

    const stocktake = await Stocktake.create({
      branchId,
      productId,
      systemQuantity,
      physicalQuantity,
      difference
    });
    const io = req.app.get("io");
    io.emit("stocktakeRecorded", {
      message: "A stocktake was recorded",
      stocktakeId: stocktake._id,
      branchId,
      productId
    });

    res.status(201).json({
      message: "Stocktake recorded successfully",
      stocktake
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create stocktake", error: error.message });
  }
};

module.exports = {
  getStocktakes,
  createStocktake
};