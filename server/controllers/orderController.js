const Order = require("../models/Order");
const Branch = require("../models/Branch");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("branchId", "branchName location")
      .populate("items.productId", "productName category sku price supplierCode")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { branchId, supplierName, status, orderDate, items } = req.body;

    if (!branchId || !supplierName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "branchId, supplierName, and at least one order item are required"
      });
    }

    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return res.status(404).json({ message: "Branch not found" });
    }

    for (const item of items) {
      if (!item.productId || !item.quantityOrdered) {
        return res.status(400).json({
          message: "Each order item must include productId and quantityOrdered"
        });
      }

      const productExists = await Product.findById(item.productId);
      if (!productExists) {
        return res.status(404).json({
          message: `Product not found for productId ${item.productId}`
        });
      }

      if (Number(item.quantityOrdered) < 1) {
        return res.status(400).json({
          message: "Each quantityOrdered must be at least 1"
        });
      }
    }

    const order = await Order.create({
      branchId,
      supplierName,
      status: status || "Pending",
      orderDate: orderDate || new Date(),
      items
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("branchId", "branchName location")
      .populate("items.productId", "productName category sku price supplierCode");

    const io = req.app.get("io");
    io.emit("orderCreated", {
      message: "A new order was created",
      orderId: populatedOrder._id,
      branchId
    });

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    if (!["Pending", "Received", "Cancelled"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Pending, Received, or Cancelled"
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    if (previousStatus !== "Received" && status === "Received") {
      for (const item of order.items) {
        let inventoryRecord = await Inventory.findOne({
          branchId: order.branchId,
          productId: item.productId
        });

        if (inventoryRecord) {
          inventoryRecord.quantityOnHand += Number(item.quantityOrdered);
          await inventoryRecord.save();
        } else {
          await Inventory.create({
            branchId: order.branchId,
            productId: item.productId,
            quantityOnHand: Number(item.quantityOrdered),
            reorderLevel: 5
          });
        }
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate("branchId", "branchName location")
      .populate("items.productId", "productName category sku price supplierCode");

    const io = req.app.get("io");
    io.emit("orderUpdated", {
      message: "Order status updated",
      orderId: updatedOrder._id,
      status: updatedOrder.status,
      branchId: updatedOrder.branchId?._id || updatedOrder.branchId
    });

    if (status === "Received") {
      io.emit("inventoryUpdated", {
        message: "Inventory updated after order received",
        orderId: updatedOrder._id,
        branchId: updatedOrder.branchId?._id || updatedOrder.branchId
      });
    }
    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus
};