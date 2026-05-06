const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Branch = require("../models/Branch");
const Product = require("../models/Product");

// Get all sales
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("branchId", "branchName location")
      .populate("productId", "productName category sku price")
      .populate("items.productId", "productName category sku price")
      .sort({ createdAt: -1 });

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sales", error: error.message });
  }
};

// Create a sale and reduce stock
const createSale = async (req, res) => {
  try {
    const { customerName, branchId, items } = req.body;

    if (!customerName || !branchId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "customerName, branchId, and at least one item are required"
      });
    }

    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    let totalSaleAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const { productId, quantitySold } = item;

      if (!productId || !quantitySold) {
        return res.status(400).json({
          message: "Each item must include productId and quantitySold"
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${productId}`
        });
      }

      const inventoryRecord = await Inventory.findOne({ branchId, productId });
      if (!inventoryRecord) {
        return res.status(404).json({
          message: `No inventory record found for ${product.productName} in this branch`
        });
      }

      if (inventoryRecord.quantityOnHand < Number(quantitySold)) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.productName}`
        });
      }

      inventoryRecord.quantityOnHand -= Number(quantitySold);
      await inventoryRecord.save();

      const unitPrice = product.price;
      const itemTotal = unitPrice * Number(quantitySold);

      totalSaleAmount += itemTotal;

      processedItems.push({
        productId,
        quantitySold: Number(quantitySold),
        unitPrice,
        totalAmount: itemTotal
      });
    }

    const sale = await Sale.create({
      customerName,
      branchId,
      items: processedItems,
      totalSaleAmount
    });

    const populatedSale = await Sale.findById(sale._id)
      .populate("branchId", "branchName location")
      .populate("items.productId", "productName category sku price");

    const io = req.app.get("io");
    io.emit("saleRecorded", {
      message: "A sale was recorded",
      saleId: populatedSale._id,
      branchId
    });
    io.emit("inventoryUpdated", {
      message: "Inventory updated after sale",
      branchId
    });

    res.status(201).json({
      message: "Sale recorded successfully",
      sale: populatedSale
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create sale",
      error: error.message
    });
  }
};

module.exports = {
  getSales,
  createSale
};