const Product = require("../models/Product");

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product", error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { productName, category, sku, price, supplierCode } = req.body;

    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: "A product with this SKU already exists" });
    }

    const product = await Product.create({
      productName,
      category,
      sku,
      price,
      supplierCode
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productName, category, sku, price, supplierCode } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku });

      if (existingProduct) {
        return res.status(400).json({ message: "A product with this SKU already exists" });
      }
    }

    product.productName = productName ?? product.productName;
    product.category = category ?? product.category;
    product.sku = sku ?? product.sku;
    product.price = price ?? product.price;
    product.supplierCode = supplierCode ?? product.supplierCode;

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

const standardizeCategories = async (req, res) => {
  try {
    const result = await Product.updateMany(
      { category: "Devices" },
      { $set: { category: "Electronics" } }
    );

    res.status(200).json({
      message: "Categories standardized successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to standardize categories",
      error: error.message
    });
  }
};

const fixCategorySKUs = async (req, res) => {
  try {
    const products = await Product.find().sort({ category: 1, createdAt: 1 });

    const categoryPrefixes = {
      Electronics: "ELEC",
      Clothing: "CLO",
      Toys: "TOY"
    };

    // Phase 1: assign temporary unique SKUs
    for (let i = 0; i < products.length; i++) {
      products[i].sku = `TEMP_${i + 1}_${Date.now()}`;
      await products[i].save();
    }

    // Phase 2: assign final category-based SKUs
    const counters = {
      Electronics: 1,
      Clothing: 1,
      Toys: 1
    };

    for (const product of products) {
      const prefix = categoryPrefixes[product.category];

      if (!prefix) continue;

      const count = counters[product.category]++;
      product.sku = `${prefix}${String(count).padStart(3, "0")}`;
      await product.save();
    }

    res.status(200).json({
      message: "SKUs updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update SKUs",
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  standardizeCategories,
  fixCategorySKUs
};
