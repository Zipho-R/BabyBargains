const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");
const Stocktake = require("../models/Stocktake");
const Order = require("../models/Order");

// 1. Low stock alerts
const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$quantityOnHand", "$reorderLevel"] }
    })
      .populate("branchId", "branchName location")
      .populate("productId", "productName category sku price")
      .sort({ quantityOnHand: 1 });

    res.status(200).json(lowStockItems);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch low stock items",
      error: error.message
    });
  }
};

// 2. Total stock per branch
const getTotalStockPerBranch = async (req, res) => {
  try {
    const totals = await Inventory.aggregate([
      {
        $group: {
          _id: "$branchId",
          totalQuantity: { $sum: "$quantityOnHand" },
          totalProducts: { $sum: 1 }
        }
      }
    ]);

    const populatedTotals = await Inventory.populate(totals, {
      path: "_id",
      select: "branchName location",
      model: "Branch"
    });

    const formatted = populatedTotals.map((item) => ({
      branch: item._id,
      totalQuantity: item.totalQuantity,
      totalProducts: item.totalProducts
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch total stock per branch",
      error: error.message
    });
  }
};

// 3. Top selling products
const getTopSellingProducts = async (req, res) => {
  try {
    const topProducts = await Sale.aggregate([
      {
        $group: {
          _id: "$productId",
          totalSold: { $sum: "$quantitySold" },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { totalSold: -1 }
      }
    ]);

    const populatedProducts = await Sale.populate(topProducts, {
      path: "_id",
      select: "productName category sku price",
      model: "Product"
    });

    const formatted = populatedProducts.map((item) => ({
      product: item._id,
      totalSold: item.totalSold,
      totalRevenue: item.totalRevenue
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch top selling products",
      error: error.message
    });
  }
};

// 4. Stock discrepancies report
const getStockDiscrepancies = async (req, res) => {
  try {
    const discrepancies = await Stocktake.find({
      difference: { $ne: 0 }
    })
      .populate("branchId", "branchName location")
      .populate("productId", "productName category sku price")
      .sort({ createdAt: -1 });

    res.status(200).json(discrepancies);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stock discrepancies",
      error: error.message
    });
  }
};

// 5. Dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalSalesRecords,
      totalOrders,
      pendingOrders,
      receivedOrders,
      cancelledOrders,
      stockTotals
    ] = await Promise.all([
      Sale.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "Pending" }),
      Order.countDocuments({ status: "Received" }),
      Order.countDocuments({ status: "Cancelled" }),
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalStockQuantity: { $sum: "$quantityOnHand" }
          }
        }
      ])
    ]);

    res.status(200).json({
      totalSalesRecords,
      totalOrders,
      pendingOrders,
      receivedOrders,
      cancelledOrders,
      totalStockQuantity: stockTotals[0]?.totalStockQuantity || 0
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard summary",
      error: error.message
    });
  }
};

module.exports = {
  getLowStockItems,
  getTotalStockPerBranch,
  getTopSellingProducts,
  getStockDiscrepancies,
  getDashboardSummary
};