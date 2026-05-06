const Product = require("../models/Product");

const importSupplierProducts = async (req, res) => {
  try {
    const supplierProducts = req.body;

    if (!Array.isArray(supplierProducts) || supplierProducts.length === 0) {
      return res.status(400).json({
        message: "Please provide a non-empty array of supplier products."
      });
    }

    const importedProducts = [];
    const skippedProducts = [];

    for (const item of supplierProducts) {
      const { productName, category, sku, price, supplierCode } = item;

      if (!productName || !category || !sku || price === undefined) {
        skippedProducts.push({
          item,
          reason: "Missing required fields: productName, category, sku, or price"
        });
        continue;
      }

      const existingProduct = await Product.findOne({ sku });

      if (existingProduct) {
        skippedProducts.push({
          item,
          reason: `Product with SKU ${sku} already exists`
        });
        continue;
      }

      const created = await Product.create({
        productName,
        category,
        sku,
        price: Number(price),
        supplierCode: supplierCode || ""
      });

      importedProducts.push(created);
    }

    res.status(201).json({
      message: "Supplier products imported successfully",
      importedCount: importedProducts.length,
      skippedCount: skippedProducts.length,
      importedProducts,
      skippedProducts
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to import supplier products",
      error: error.message
    });
  }
};

module.exports = {
  importSupplierProducts
};