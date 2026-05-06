import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const initialItem = {
  productId: "",
  quantityOrdered: ""
};

const initialFormState = {
  branchId: "",
  supplierName: "",
  status: "Pending",
  items: [{ ...initialItem }]
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedBranchFilter, setSelectedBranchFilter] =
    useState("All");

  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState("All");

  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        api.get("/orders"),
        api.get("/branches"),
        api.get("/products")
      ]);

      const [ordersResult, branchesResult, productsResult] =
        results;

      setOrders(
        ordersResult.status === "fulfilled"
          ? ordersResult.value.data || []
          : []
      );

      setBranches(
        branchesResult.status === "fulfilled"
          ? branchesResult.value.data || []
          : []
      );

      setProducts(
        productsResult.status === "fulfilled"
          ? productsResult.value.data || []
          : []
      );
    } catch (error) {
      console.error("Unexpected fetch error:", error);
      alert("Failed to load procurement data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (selectedBranchFilter !== "All") {
      result = result.filter((order) => {
        const orderBranchId =
          typeof order.branchId === "string"
            ? order.branchId
            : order.branchId?._id;

        return orderBranchId === selectedBranchFilter;
      });
    }

    if (selectedStatusFilter !== "All") {
      result = result.filter(
        (order) => order.status === selectedStatusFilter
      );
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();

      result = result.filter((order) => {
        const supplierMatch =
          order.supplierName?.toLowerCase().includes(query);

        const branchMatch =
          order.branchId?.branchName
            ?.toLowerCase()
            .includes(query);

        const statusMatch =
          order.status?.toLowerCase().includes(query);

        const itemMatch = order.items?.some((item) => {
          return (
            item.productId?.productName
              ?.toLowerCase()
              .includes(query) ||
            item.productId?.category
              ?.toLowerCase()
              .includes(query) ||
            item.productId?.sku
              ?.toLowerCase()
              .includes(query)
          );
        });

        return (
          supplierMatch ||
          branchMatch ||
          statusMatch ||
          itemMatch
        );
      });
    }

    return result;
  }, [
    orders,
    selectedBranchFilter,
    selectedStatusFilter,
    searchTerm
  ]);

  const handleBasicChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleItemChange = (index, field, value) => {
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
        items: prev.items.filter((_, i) => i !== index)
      };
    });
  };

  const resetForm = () => {
    setFormData({
      branchId: "",
      supplierName: "",
      status: "Pending",
      items: [{ ...initialItem }]
    });
  };

  const clearFilters = () => {
    setSelectedBranchFilter("All");
    setSelectedStatusFilter("All");
    setSearchTerm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const cleanedItems = formData.items.map((item) => ({
        productId: item.productId,
        quantityOrdered: Number(item.quantityOrdered)
      }));

      await api.post("/orders", {
        branchId: formData.branchId,
        supplierName: formData.supplierName,
        status: formData.status,
        items: cleanedItems
      });

      alert("Supplier order created successfully.");

      resetForm();

      await fetchData();
    } catch (error) {
      console.error("Failed to create order:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to create order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (
    orderId,
    newStatus
  ) => {
    try {
      await api.put(`/orders/${orderId}/status`, {
        status: newStatus
      });

      alert(`Order marked as ${newStatus}.`);

      await fetchData();
    } catch (error) {
      console.error("Failed to update order status:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to update order status."
      );
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Procurement</p>

          <h1>Supplier Orders</h1>

          <p className="page-subtext">
            Create supplier orders, track order status,
            and support stock replenishment for each branch.
          </p>
        </div>
      </div>

      <div className="form-card compact-entry-card orders-entry-theme">
        <h2>Create Order</h2>

        <form
          className="orders-clean-form"
          onSubmit={handleSubmit}
        >
          <div className="orders-top-row simple-orders-top-row">
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleBasicChange}
              required
            >
              <option value="">Select Branch</option>

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
              name="supplierName"
              placeholder="Supplier Name"
              value={formData.supplierName}
              onChange={handleBasicChange}
              required
            />
          </div>

          <div className="orders-items-box">
            <div className="compact-box-header">
              <h3>Order Items</h3>
            </div>

            <div className="orders-item-list">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="orders-item-row"
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

                    {products.map((product) => (
                      <option
                        key={product._id}
                        value={product._id}
                      >
                        {product.productName} —{" "}
                        {product.category}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Quantity Ordered"
                    value={item.quantityOrdered}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantityOrdered",
                        e.target.value
                      )
                    }
                    required
                  />

                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="orders-submit-row">
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
                  ? "Creating..."
                  : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="table-card tight-table-card">
        <div className="table-header">
          <h2>Order History</h2>

          <div className="table-filters">
            <input
              type="text"
              placeholder="Search supplier, branch, product, status..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            <label htmlFor="orderBranchFilter">
              Branch
            </label>

            <select
              id="orderBranchFilter"
              value={selectedBranchFilter}
              onChange={(e) =>
                setSelectedBranchFilter(e.target.value)
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

            <label htmlFor="orderStatusFilter">
              Status
            </label>

            <select
              id="orderStatusFilter"
              value={selectedStatusFilter}
              onChange={(e) =>
                setSelectedStatusFilter(e.target.value)
              }
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Received">
                Received
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>

            {(searchTerm ||
              selectedBranchFilter !== "All" ||
              selectedStatusFilter !== "All") && (
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
        ) : filteredOrders.length === 0 ? (
          <p className="empty-state">
            No supplier orders match your current filters.
          </p>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="form-card orders-history-card"
              >
                <h3>
                  {order.branchId?.branchName || "—"} —{" "}
                  {order.supplierName ||
                    "Unknown Supplier"}
                </h3>

                <p>
                  Status:{" "}
                  <span
                    className={`status-pill ${
                      order.status === "Pending"
                        ? "pending"
                        : order.status === "Received"
                        ? "received"
                        : "cancelled"
                    }`}
                  >
                    <span className="dot"></span>
                    {order.status}
                  </span>
                </p>

                <p>
                  Order Date:{" "}
                  <strong>
                    {order.orderDate
                      ? new Date(
                          order.orderDate
                        ).toLocaleDateString()
                      : "—"}
                  </strong>
                </p>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>SKU</th>
                      <th>Quantity Ordered</th>
                    </tr>
                  </thead>

                  <tbody>
                    {Array.isArray(order.items) &&
                    order.items.length > 0 ? (
                      order.items.map(
                        (item, index) => (
                          <tr key={index}>
                            <td>
                              {item.productId
                                ?.productName || "—"}
                            </td>

                            <td>
                              {item.productId
                                ?.category || "—"}
                            </td>

                            <td>
                              {item.productId?.sku ||
                                "—"}
                            </td>

                            <td>
                              {item.quantityOrdered ||
                                0}
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td colSpan="4">
                          No items available for this
                          order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="table-actions order-status-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={
                      order.status === "Pending"
                    }
                    onClick={() =>
                      handleStatusUpdate(
                        order._id,
                        "Pending"
                      )
                    }
                  >
                    Mark Pending
                  </button>

                  <button
                    type="button"
                    className="primary-btn"
                    disabled={
                      order.status === "Received"
                    }
                    onClick={() =>
                      handleStatusUpdate(
                        order._id,
                        "Received"
                      )
                    }
                  >
                    Mark Received
                  </button>

                  <button
                    type="button"
                    className="danger-btn"
                    disabled={
                      order.status === "Cancelled"
                    }
                    onClick={() =>
                      handleStatusUpdate(
                        order._id,
                        "Cancelled"
                      )
                    }
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;