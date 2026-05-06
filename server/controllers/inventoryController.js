const Inventory = require("../models/Inventory");
const Branch = require("../models/Branch");
const Product = require("../models/Product");

const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("branchId", "branchName location")
      .populate("productId", "productName category sku price")
      .sort({ createdAt: -1 });

    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory", error: error.message });
  }
};

const getInventoryByBranch = async (req, res) => {
  try {
    const inventory = await Inventory.find({ branchId: req.params.branchId })
      .populate("branchId", "branchName location")
      .populate("productId", "productName category sku price")
      .sort({ createdAt: -1 });

    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch branch inventory", error: error.message });
  }
};

const createInventory = async (req, res) => {
  try {
    const { branchId, productId, quantityOnHand, reorderLevel } = req.body;

    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingInventory = await Inventory.findOne({ branchId, productId });
    if (existingInventory) {
      return res.status(400).json({
        message: "Inventory record already exists for this product in this branch"
      });
    }

    const inventory = await Inventory.create({
      branchId,
      productId,
      quantityOnHand,
      reorderLevel
    });

    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Failed to create inventory", error: error.message });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { quantityOnHand, reorderLevel } = req.body;

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory record not found" });
    }

    inventory.quantityOnHand = quantityOnHand ?? inventory.quantityOnHand;
    inventory.reorderLevel = reorderLevel ?? inventory.reorderLevel;

    const updatedInventory = await inventory.save();
    res.status(200).json(updatedInventory);
  } catch (error) {
    res.status(500).json({ message: "Failed to update inventory", error: error.message });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory record not found" });
    }

    await inventory.deleteOne();

    res.status(200).json({ message: "Inventory record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete inventory", error: error.message });
  }
};

module.exports = {
  getInventory,
  getInventoryByBranch,
  createInventory,
  updateInventory,
  deleteInventory
};