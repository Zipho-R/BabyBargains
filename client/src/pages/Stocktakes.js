import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const initialFormState = {
  branchId: "",
  productId: "",
  physicalQuantity: ""
};

function Stocktakes() {
  const [stocktakes, setStocktakes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedBranchFilter, setSelectedBranchFilter] =
    useState("All");

  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] =
    useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [stocktakesRes, branchesRes, inventoryRes] =
        await Promise.all([
          api.get("/stocktakes"),
          api.get("/branches"),
          api.get("/inventory")
        ]);

      setStocktakes(stocktakesRes.data || []);
      setBranches(branchesRes.data || []);
      setInventory(inventoryRes.data || []);
    } catch (error) {
      console.error(
        "Failed to fetch stocktake data:",
        error
      );

      alert("Failed to fetch stocktake data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableProductsForSelectedBranch =
    useMemo(() => {
      if (!formData.branchId) return [];

      return inventory.filter(
        (item) =>
          item.branchId?._id ===
          formData.branchId
      );
    }, [inventory, formData.branchId]);

  const filteredStocktakes = useMemo(() => {
    let result = stocktakes;

    if (selectedBranchFilter !== "All") {
      result = result.filter(
        (item) =>
          item.branchId?._id ===
          selectedBranchFilter
      );
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();

      result = result.filter((item) => {
        return (
          item.branchId?.branchName
            ?.toLowerCase()
            .includes(query) ||
          item.productId?.productName
            ?.toLowerCase()
            .includes(query) ||
          item.productId?.category
            ?.toLowerCase()
            .includes(query)
        );
      });
    }

    return result;
  }, [
    stocktakes,
    selectedBranchFilter,
    searchTerm
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "branchId") {
      setFormData((prev) => ({
        ...prev,
        branchId: value,
        productId: ""
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setSelectedBranchFilter("All");
    setSearchTerm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      await api.post("/stocktakes", {
        ...formData,
        physicalQuantity: Number(
          formData.physicalQuantity
        )
      });

      alert(
        "Stocktake recorded successfully."
      );

      setFormData(initialFormState);

      await fetchData();
    } catch (error) {
      console.error(
        "Failed to record stocktake:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to record stocktake."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Stock Control
          </p>

          <h1>
            Stocktake & Discrepancy Tracking
          </h1>

          <p className="page-subtext">
            Compare physical stock counts
            against system quantities and
            record inventory discrepancies.
          </p>
        </div>
      </div>

      <div className="form-card">
        <h2>Record Stocktake</h2>

        <form
          className="data-form"
          onSubmit={handleSubmit}
        >
          <select
            name="branchId"
            value={formData.branchId}
            onChange={handleChange}
            required
          >
            <option value="">
              Select Branch
            </option>

            {branches.map((branch) => (
              <option
                key={branch._id}
                value={branch._id}
              >
                {branch.branchName}
              </option>
            ))}
          </select>

          <select
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            required
            disabled={!formData.branchId}
          >
            <option value="">
              {formData.branchId
                ? "Select Product"
                : "Select Branch First"}
            </option>

            {availableProductsForSelectedBranch.map(
              (item) => (
                <option
                  key={item._id}
                  value={
                    item.productId?._id
                  }
                >
                  {
                    item.productId
                      ?.productName
                  }{" "}
                  (System:{" "}
                  {
                    item.quantityOnHand
                  })
                </option>
              )
            )}
          </select>

          <input
            type="number"
            min="0"
            name="physicalQuantity"
            placeholder="Physical Quantity"
            value={formData.physicalQuantity}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="primary-btn"
            disabled={submitting}
          >
            {submitting
              ? "Recording..."
              : "Record Stocktake"}
          </button>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>Stocktake History</h2>

          <div className="table-filters">
            <input
              type="text"
              placeholder="Search branch, product, category..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

            <label htmlFor="stocktakeBranchFilter">
              Branch
            </label>

            <select
              id="stocktakeBranchFilter"
              value={selectedBranchFilter}
              onChange={(e) =>
                setSelectedBranchFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Branches
              </option>

              {branches.map((branch) => (
                <option
                  key={branch._id}
                  value={branch._id}
                >
                  {branch.branchName}
                </option>
              ))}
            </select>

            {(searchTerm ||
              selectedBranchFilter !==
                "All") && (
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
        ) : filteredStocktakes.length ===
          0 ? (
          <p className="empty-state">
            No stocktake records match your
            current filters.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Product</th>
                <th>Category</th>
                <th>System Quantity</th>
                <th>Physical Quantity</th>
                <th>Difference</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredStocktakes.map(
                (item) => (
                  <tr key={item._id}>
                    <td>
                      {item.branchId
                        ?.branchName || "—"}
                    </td>

                    <td>
                      {item.productId
                        ?.productName || "—"}
                    </td>

                    <td>
                      {item.productId
                        ?.category || "—"}
                    </td>

                    <td>
                      {item.systemQuantity}
                    </td>

                    <td>
                      {
                        item.physicalQuantity
                      }
                    </td>

                    <td>
                      <span
                        className={`stock-pill ${
                          item.difference !==
                          0
                            ? "low"
                            : "healthy"
                        }`}
                      >
                        <span className="dot"></span>

                        {item.difference}
                      </span>
                    </td>

                    <td>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Stocktakes;