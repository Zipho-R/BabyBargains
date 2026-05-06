const express = require("express");
const router = express.Router();

const {
  getInventory,
  getInventoryByBranch,
  createInventory,
  updateInventory,
  deleteInventory
} = require("../controllers/inventoryController");

router.get("/", getInventory);
router.get("/branch/:branchId", getInventoryByBranch);
router.post("/", createInventory);
router.put("/:id", updateInventory);
router.delete("/:id", deleteInventory);

module.exports = router;