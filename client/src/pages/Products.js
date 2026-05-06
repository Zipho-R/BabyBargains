import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const initialFormState = {
  productName: "",
  category: "",
  sku: "",
  price: "",
  supplierCode: ""
};

const initialImportState = `[
  {
    "productName": "Pacifier Set",
    "category": "Feeding",
    "sku": "FED002",
    "price": 75,
    "supplierCode": "SUP004"
  },
  {
    "productName": "Baby Lotion",
    "category": "Skincare",
    "sku": "SKN001",
    "price": 95,
    "supplierCode": "SUP008"
  }
]`;

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(initialFormState);
  const [importJson, setImportJson] = useState(initialImportState);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const response = await api.get("/products");
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      alert("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((product) => product.category).filter(Boolean))
    ];

    return ["All", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter((product) => product.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();

      result = result.filter((product) => {
        return (
          product.productName?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.supplierCode?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [products, selectedCategory, searchTerm]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price)
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        alert("Product updated successfully.");
      } else {
        await api.post("/products", payload);
        alert("Product added successfully.");
      }

      resetForm();
      await fetchProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert(error?.response?.data?.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      productName: product.productName || "",
      category: product.category || "",
      sku: product.sku || "",
      price: product.price ?? "",
      supplierCode: product.supplierCode || ""
    });

    setEditingId(product._id);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/products/${id}`);

      if (editingId === id) {
        resetForm();
      }

      alert("Product deleted successfully.");
      await fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert(error?.response?.data?.message || "Failed to delete product.");
    }
  };

  const handleImportProducts = async () => {
    setImporting(true);

    try {
      const parsedJson = JSON.parse(importJson);

      if (!Array.isArray(parsedJson)) {
        alert("Supplier import must be a JSON array of products.");
        return;
      }

      const response = await api.post("/supplier/import", parsedJson);

      alert(
        `${response.data.message}\nImported: ${response.data.importedCount}\nSkipped: ${response.data.skippedCount}`
      );

      await fetchProducts();
    } catch (error) {
      console.error("Failed to import supplier products:", error);

      if (error instanceof SyntaxError) {
        alert("Invalid JSON format. Please check the supplier JSON.");
      } else {
        alert(
          error?.response?.data?.message ||
            "Failed to import supplier products."
        );
      }
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Master Data</p>
          <h1>Product Catalogue</h1>
          <p className="page-subtext">
            Manage the central product list, categories, SKUs, prices, and
            supplier references used by all branches.
          </p>
        </div>
      </div>

      <div className="form-card">
        <h2>{editingId ? "Edit Product" : "Add Product"}</h2>

        <form className="data-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="productName"
            placeholder="Product Name"
            value={formData.productName}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="sku"
            placeholder="SKU"
            value={formData.sku}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            min="0"
            step="0.01"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="supplierCode"
            placeholder="Supplier Code"
            value={formData.supplierCode}
            onChange={handleChange}
          />

          <div className="form-actions">
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                ? "Update Product"
                : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="form-card">
        <h2>Import Supplier Products</h2>

        <p className="page-subtext">
          Paste a JSON array of supplier products and import them into the
          product catalogue.
        </p>

        <textarea
          className="json-textarea"
          rows="12"
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
        />

        <div className="form-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={handleImportProducts}
            disabled={importing}
          >
            {importing ? "Importing..." : "Import Supplier Products"}
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>Product List</h2>

          <div className="table-filters">
            <input
              type="text"
              placeholder="Search product, SKU, category, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <label htmlFor="categoryFilter">Category</label>

            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {(searchTerm || selectedCategory !== "All") && (
              <button
                type="button"
                className="secondary-btn"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loader-wrap">
            <div className="loader"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="empty-state">
            No products match your current search or category filter.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Supplier Code</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>{product.productName}</td>
                  <td>{product.category}</td>
                  <td>{product.sku}</td>
                  <td>R{Number(product.price).toFixed(2)}</td>
                  <td>{product.supplierCode || "—"}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => handleDelete(product._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Products;