const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

app.use(cors());
app.use(express.json());

app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/sales", require("./routes/salesRoutes"));
app.use("/api/stocktakes", require("./routes/stocktakeRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/supplier", require("./routes/supplierRoutes"));
app.use("/api/orders", require("./routes/ordersRoutes"));

app.get("/", (req, res) => {
  res.send("BabyBargains API is running...");
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});