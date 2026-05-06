const express = require("express");
const router = express.Router();

const {
  getStocktakes,
  createStocktake
} = require("../controllers/stocktakeController");

router.route("/")
  .get(getStocktakes)
  .post(createStocktake);

module.exports = router;