import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const initialItem = {
  productId: "",
  quantitySold: ""
};

const initialFormState = {
  customerName: "",
  branchId: "",
  items: [{ ...initialItem }]
};

function Sales() {
  const [sales, setSales] = useState([]);
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
      const results = await Promise.allSettled([
        api.get("/sales"),
        api.get("/branches"),
        api.get("/inventory")
      ]);

      const [salesResult, branchesResult, inventoryResult] =
        results;

      setSales(
        salesResult.status === "fulfilled"
          ? salesResult.value.data || []
          : []
      );

      setBranches(
        branchesResult.status === "fulfilled"
          ? branchesResult.value.data || []
          : []
      );

      setInventory(
        inventoryResult.status === "fulfilled"
          ? inventoryResult.value.data || []
          : []
      );
    } catch (error) {
      console.error("Unexpected fetch error:", error);
      alert("Failed to load sales data.");
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

      return inventory.filter((item) => {
        const itemBranchId =
          typeof item.branchId === "string"
            ? item.branchId
            : item.branchId?._id;

        return (
          itemBranchId === formData.branchId &&
          Number(item.quantityOnHand) > 0
        );
      });
    }, [inventory, formData.branchId]);

  const filteredSales = useMemo(() => {
    let result = sales;

    if (selectedBranchFilter !== "All") {
      result = result.filter((sale) => {
        const saleBranchId =
          typeof sale.branchId === "string"
            ? sale.branchId
            : sale.branchId?._id;

        return saleBranchId === selectedBranchFilter;
      });
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();

      result = result.filter((sale) => {
        const customerMatch =
          sale.customerName
            ?.toLowerCase()
            .includes(query);

        const branchMatch =
          sale.branchId?.branchName
            ?.toLowerCase()
            .includes(query);

        const itemMatch = sale.items?.some((item) => {
          return (
            item.productId?.productName
              ?.toLowerCase()
              .includes(query) ||
            item.productId?.category
              ?.toLowerCase()
              .includes(query)
          );
        });

        return (
          customerMatch ||
          branchMatch ||
          itemMatch
        );
      });
    }

    return result;
  }, [sales, selectedBranchFilter, searchTerm]);

  const getSaleItems = (sale) => {
    if (
      Array.isArray(sale.items) &&
      sale.items.length > 0
    ) {
      return sale.items;
    }

    if (sale.productId) {
      return [
        {
          productId: sale.productId,
          quantitySold: sale.quantitySold,
          unitPrice: sale.unitPrice,
          totalAmount: sale.totalAmount
        }
      ];
    }

    return [];
  };

  const getSaleTotal = (sale) => {
    return (
      sale.totalSaleAmount ??
      sale.totalAmount ??
      0
    );
  };

  const handleBasicChange = (e) => {
    const { name, value } = e.target;

    if (name === "branchId") {
      setFormData((prev) => ({
        ...prev,
        branchId: value,
        items: [{ ...initialItem }]
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };

      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...initialItem }]
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      if (prev.items.length === 1) return prev;

      return {
        ...prev,
        items: prev.items.filter(
          (_, i) => i !== index
        )
      };
    });
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      branchId: "",
      items: [{ ...initialItem }]
    });
  };

  const clearFilters = () => {
    setSelectedBranchFilter("All");
    setSearchTerm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const cleanedItems = formData.items.map(
        (item) => ({
          productId: item.productId,
          quantitySold: Number(
            item.quantitySold
          )
        })
      );

      await api.post("/sales", {
        customerName: formData.customerName,
        branchId: formData.branchId,
        items: cleanedItems
      });

      alert("Sale recorded successfully.");

      resetForm();

      await fetchData();
    } catch (error) {
      console.error(
        "Failed to record sale:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to record sale."
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
            Sales Operations
          </p>

          <h1>Sales Processing</h1>

          <p className="page-subtext">
            Record multi-item customer sales
            and automatically update branch
            inventory after each transaction.
          </p>
        </div>
      </div>

      <div className="form-card compact-entry-card sales-entry-theme">
        <h2>Record Sale</h2>

        <form
          className="sales-clean-form"
          onSubmit={handleSubmit}
        >
          <div className="sales-top-row">
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleBasicChange}
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

            <input
              type="text"
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={handleBasicChange}
              required
            />
          </div>

          <div className="sales-items-box">
            <div className="compact-box-header">
              <h3>Sales Items</h3>
            </div>

            <div className="sales-item-list">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="sales-item-row"
                >
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "productId",
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select Product
                    </option>

                    {availableProductsForSelectedBranch.map(
                      (inv) => (
                        <option
                          key={inv._id}
                          value={
                            inv.productId?._id
                          }
                        >
                          {
                            inv.productId
                              ?.productName
                          }{" "}
                          —{" "}
                          {
                            inv.productId
                              ?.category
                          }{" "}
                          —{" "}
                          {
                            inv.quantityOnHand
                          }{" "}
                          in stock
                        </option>
                      )
                    )}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Quantity Sold"
                    value={item.quantitySold}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantitySold",
                        e.target.value
                      )
                    }
                    required
                  />

                  {formData.items.length >
                    1 && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() =>
                        removeItem(index)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="sales-submit-row">
              <button
                type="button"
                className="secondary-btn"
                onClick={addItem}
              >
                Add Another Product
              </button>

              <button
                type="submit"
                className="primary-btn"
                disabled={submitting}
              >
                {submitting
                  ? "Recording..."
                  : "Record Sale"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="table-card tight-table-card">
        <div className="table-header">
          <h2>Sales History</h2>

          <div className="table-filters">
            <input
              type="text"
              placeholder="Search customer, branch, product..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            <label htmlFor="salesBranchFilter">
              Branch
            </label>

            <select
              id="salesBranchFilter"
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
        ) : filteredSales.length === 0 ? (
          <p className="empty-state">
            No sales records match your current
            filters.
          </p>
        ) : (
          <div className="orders-list">
            {filteredSales.map((sale) => {
              const saleItems =
                getSaleItems(sale);

              const displayTotal =
                getSaleTotal(sale);

              return (
                <div
                  key={sale._id}
                  className="form-card sales-history-card"
                >
                  <h3>
                    {sale.customerName ||
                      "Walk-in Customer"}{" "}
                    —{" "}
                    {sale.branchId
                      ?.branchName || "—"}
                  </h3>

                  <p>
                    Total Sale Amount:{" "}
                    <strong>
                      R
                      {Number(
                        displayTotal || 0
                      ).toFixed(2)}
                    </strong>
                  </p>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>
                          Quantity Sold
                        </th>
                        <th>
                          Unit Price
                        </th>
                        <th>
                          Total Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {saleItems.length >
                      0 ? (
                        saleItems.map(
                          (
                            item,
                            index
                          ) => (
                            <tr
                              key={index}
                            >
                              <td>
                                {item
                                  .productId
                                  ?.productName ||
                                  "—"}
                              </td>

                              <td>
                                {item.quantitySold ||
                                  0}
                              </td>

                              <td>
                                R
                                {Number(
                                  item.unitPrice ||
                                    0
                                ).toFixed(
                                  2
                                )}
                              </td>

                              <td>
                                R
                                {Number(
                                  item.totalAmount ||
                                    0
                                ).toFixed(
                                  2
                                )}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td colSpan="4">
                            No line items
                            available for
                            this sale.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales;