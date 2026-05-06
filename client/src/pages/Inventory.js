import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const initialFormState = {
  branchId: "",
  productId: "",
  quantityOnHand: "",
  reorderLevel: ""
};

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [inventoryRes, branchesRes, productsRes] = await Promise.all([
        api.get("/inventory"),
        api.get("/branches"),
        api.get("/products")
      ]);

      setInventory(inventoryRes.data || []);
      setBranches(branchesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
      alert("Failed to fetch inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInventory = useMemo(() => {
    let result = inventory;

    if (selectedBranch !== "All") {
      result = result.filter(
        (item) => item.branchId?._id === selectedBranch
      );
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();

      result = result.filter((item) => {
        return (
          item.productId?.productName?.toLowerCase().includes(query) ||
          item.productId?.category?.toLowerCase().includes(query) ||
          item.productId?.sku?.toLowerCase().includes(query) ||
          item.branchId?.branchName?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [inventory, selectedBranch, searchTerm]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const clearFilters = () => {
    setSelectedBranch("All");
    setSearchTerm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/inventory", {
        ...formData,
        quantityOnHand: Number(formData.quantityOnHand),
        reorderLevel: Number(formData.reorderLevel)
      });

      alert("Inventory added successfully.");

      setFormData(initialFormState);

      await fetchData();
    } catch (error) {
      console.error("Failed to add inventory:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to add inventory."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventory Management</p>

          <h1>Stock Levels</h1>

          <p className="page-subtext">
            Assign products to branches, monitor stock quantities,
            and identify items approaching reorder level.
          </p>
        </div>
      </div>

      <div className="form-card">
        <h2>Add Inventory Record</h2>

        <form className="data-form" onSubmit={handleSubmit}>
          <select
            name="branchId"
            value={formData.branchId}
            onChange={handleChange}
            required
          >
            <option value="">Select Branch</option>

            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.branchName}
              </option>
            ))}
          </select>

          <select
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            required
          >
            <option value="">Select Product</option>

            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.productName}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            name="quantityOnHand"
            placeholder="Quantity On Hand"
            value={formData.quantityOnHand}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            min="0"
            name="reorderLevel"
            placeholder="Reorder Level"
            value={formData.reorderLevel}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="primary-btn"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Inventory"}
          </button>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>Inventory Records</h2>

          <div className="table-filters">
            <input
              type="text"
              placeholder="Search product, branch, category, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <label htmlFor="branchFilter">Branch</label>

            <select
              id="branchFilter"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="All">All Branches</option>

              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.branchName}
                </option>
              ))}
            </select>

            {(searchTerm || selectedBranch !== "All") && (
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
        ) : filteredInventory.length === 0 ? (
          <p className="empty-state">
            No inventory records match your current filters.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Quantity On Hand</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredInventory.map((item) => {
                const isLowStock =
                  item.quantityOnHand <= item.reorderLevel;

                return (
                  <tr key={item._id}>
                    <td>{item.branchId?.branchName || "—"}</td>

                    <td>{item.productId?.productName || "—"}</td>

                    <td>{item.productId?.category || "—"}</td>

                    <td>{item.productId?.sku || "—"}</td>

                    <td>{item.quantityOnHand}</td>

                    <td>{item.reorderLevel}</td>

                    <td>
                      <span
                        className={`stock-pill ${
                          isLowStock ? "low" : "healthy"
                        }`}
                      >
                        <span className="dot"></span>

                        {isLowStock ? "Low Stock" : "Healthy"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Inventory;