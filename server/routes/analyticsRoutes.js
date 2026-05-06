const express = require("express");
const router = express.Router();

const {
  getLowStockItems,
  getTotalStockPerBranch,
  getTopSellingProducts,
  getStockDiscrepancies,
  getDashboardSummary
} = require("../controllers/analyticsController");

router.get("/low-stock", getLowStockItems);
router.get("/stock-per-branch", getTotalStockPerBranch);
router.get("/top-selling-products", getTopSellingProducts);
router.get("/stock-discrepancies", getStockDiscrepancies);
router.get("/summary", getDashboardSummary);

module.exports = router;