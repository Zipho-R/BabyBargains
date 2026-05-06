import { useEffect, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";

function Dashboard() {
  const [branchCount, setBranchCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [summary, setSummary] = useState({
    totalSalesRecords: 0,
    totalOrders: 0,
    pendingOrders: 0,
    receivedOrders: 0,
    cancelledOrders: 0,
    totalStockQuantity: 0
  });

  const [stockPerBranch, setStockPerBranch] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const [
        branchesRes,
        productsRes,
        lowStockRes,
        stockPerBranchRes,
        topProductsRes,
        discrepanciesRes,
        summaryRes
      ] = await Promise.all([
        api.get("/branches"),
        api.get("/products"),
        api.get("/analytics/low-stock"),
        api.get("/analytics/stock-per-branch"),
        api.get("/analytics/top-selling-products"),
        api.get("/analytics/stock-discrepancies"),
        api.get("/analytics/summary")
      ]);

      setBranchCount(branchesRes.data.length);
      setProductCount(productsRes.data.length);
      setLowStockCount(lowStockRes.data.length);
      setStockPerBranch(stockPerBranchRes.data || []);
      setTopProducts(topProductsRes.data || []);
      setDiscrepancies(discrepanciesRes.data || []);
      setSummary(summaryRes.data || {});
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    socket.on("saleRecorded", fetchDashboardData);
    socket.on("inventoryUpdated", fetchDashboardData);
    socket.on("orderCreated", fetchDashboardData);
    socket.on("orderUpdated", fetchDashboardData);
    socket.on("stocktakeRecorded", fetchDashboardData);

    return () => {
      socket.off("saleRecorded", fetchDashboardData);
      socket.off("inventoryUpdated", fetchDashboardData);
      socket.off("orderCreated", fetchDashboardData);
      socket.off("orderUpdated", fetchDashboardData);
      socket.off("stocktakeRecorded", fetchDashboardData);
    };
  }, []);

  const topProduct = topProducts[0];

  return (
    <div className="page dashboard-page">
      <section className="dashboard-hero-clean">
        <div>
          <p className="eyebrow">Enterprise Operations</p>

          <h1>Enterprise Inventory Control Centre</h1>

          <p>
            Monitor inventory movement, supplier procurement, branch stock
            levels, sales activity, and operational discrepancies across the
            BabyBargains retail network.
          </p>
        </div>

        <div className="hero-side-card">
          <span>Total Inventory Units</span>

          <strong>{summary.totalStockQuantity || 0}</strong>

          <small>Live operational inventory count</small>
        </div>
      </section>

      <section className="erp-module-strip">
        <div className="erp-module-card">
          <span>Master Data</span>
          <strong>Branches & Products</strong>
          <p>Maintain retail master records and product catalogue data.</p>
        </div>

        <div className="erp-module-card">
          <span>Inventory Management</span>
          <strong>Stock Monitoring</strong>
          <p>Track inventory levels and low-stock alerts across branches.</p>
        </div>

        <div className="erp-module-card">
          <span>Sales Operations</span>
          <strong>Sales Processing</strong>
          <p>Capture customer transactions and inventory movement.</p>
        </div>

        <div className="erp-module-card">
          <span>Procurement</span>
          <strong>Supplier Orders</strong>
          <p>Manage supplier replenishment workflows and stock recovery.</p>
        </div>
      </section>

      <section className="dashboard-tile-grid">
        <div className="dashboard-tile tile-purple">
          <span>Total Branches</span>
          <strong>{branchCount}</strong>
          <p>Retail branch locations</p>
        </div>

        <div className="dashboard-tile tile-pink">
          <span>Products</span>
          <strong>{productCount}</strong>
          <p>Catalogue products registered</p>
        </div>

        <div className="dashboard-tile tile-blue">
          <span>Total Orders</span>
          <strong>{summary.totalOrders || 0}</strong>
          <p>Supplier procurement orders</p>
        </div>

        <div className="dashboard-tile tile-orange">
          <span>Low Stock Alerts</span>
          <strong>{lowStockCount}</strong>
          <p>Products requiring replenishment</p>
        </div>

        <div className="dashboard-tile tile-green">
          <span>Sales Records</span>
          <strong>{summary.totalSalesRecords || 0}</strong>
          <p>Completed customer transactions</p>
        </div>
      </section>

      <section className="dashboard-split">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inventory Analytics</p>
              <h2>Stock Per Branch</h2>
            </div>
          </div>

          {stockPerBranch.length === 0 ? (
            <p className="empty-state">
              Inventory analytics will appear once stock records are created.
            </p>
          ) : (
            <div className="dashboard-list">
              {stockPerBranch.map((item, index) => (
                <div key={index} className="dashboard-list-item">
                  <div>
                    <strong>
                      {item.branch?.branchName || "Unknown Branch"}
                    </strong>

                    <span>
                      {item.totalProducts} inventory records assigned
                    </span>
                  </div>

                  <b>{item.totalQuantity}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Sales Analytics</p>
              <h2>Top Selling Products</h2>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <p className="empty-state">
              Sales analytics will appear once transactions are recorded.
            </p>
          ) : (
            <div className="dashboard-list">
              {topProducts.slice(0, 5).map((item, index) => (
                <div key={index} className="dashboard-list-item product-rank">
                  <div>
                    <strong>
                      {item.product?.productName || "Unknown Product"}
                    </strong>

                    <span>
                      Revenue: R
                      {Number(item.totalRevenue || 0).toFixed(2)}
                    </span>
                  </div>

                  <b>{item.totalSold || 0} sold</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-split">
        <div className="dashboard-panel warning-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inventory Risk</p>
              <h2>Low Stock Monitoring</h2>
            </div>
          </div>

          <div className="alert-summary">
            <strong>{lowStockCount}</strong>

            <span>
              inventory items are currently below or near reorder level
            </span>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Operational Exceptions</p>
              <h2>Stock Discrepancies</h2>
            </div>
          </div>

          {discrepancies.length === 0 ? (
            <p className="empty-state">
              No stock discrepancies have been recorded.
            </p>
          ) : (
            <div className="dashboard-list">
              {discrepancies.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="dashboard-list-item discrepancy"
                >
                  <div>
                    <strong>
                      {item.branchId?.branchName || "Branch"} —{" "}
                      {item.productId?.productName || "Product"}
                    </strong>

                    <span>Recorded stock variance detected</span>
                  </div>

                  <b>{item.difference}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-split">
        <div className="dashboard-panel sales-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Sales Operations</p>
              <h2>Sales Summary</h2>
            </div>
          </div>

          <div className="focus-row">
            <div>
              <span>Sales Records</span>
              <strong>{summary.totalSalesRecords || 0}</strong>
            </div>

            <div>
              <span>Top Product</span>
              <strong>
                {topProduct?.product?.productName || "—"}
              </strong>
            </div>

            <div>
              <span>Units Sold</span>
              <strong>{topProduct?.totalSold || 0}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-panel orders-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Procurement</p>
              <h2>Supplier Order Status</h2>
            </div>
          </div>

          <div className="focus-row four">
            <div>
              <span>Pending</span>
              <strong>{summary.pendingOrders || 0}</strong>
            </div>

            <div>
              <span>Received</span>
              <strong>{summary.receivedOrders || 0}</strong>
            </div>

            <div>
              <span>Cancelled</span>
              <strong>{summary.cancelledOrders || 0}</strong>
            </div>

            <div>
              <span>Total Orders</span>
              <strong>{summary.totalOrders || 0}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;