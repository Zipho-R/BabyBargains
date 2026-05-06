const express = require("express");
const router = express.Router();

const {
  importSupplierProducts
} = require("../controllers/supplierController");

router.post("/import", importSupplierProducts);

module.exports = router;