const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  standardizeCategories,
  fixCategorySKUs
} = require("../controllers/productController");

router.route("/")
  .get(getProducts)
  .post(createProduct);

router.put("/standardize/categories", standardizeCategories);

router.put("/fix-skus", fixCategorySKUs);

router.route("/:id")
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;