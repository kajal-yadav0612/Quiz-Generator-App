require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const quizRoutes = require("./routes/quizRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { verifyToken } = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin :["https://deploy-mern-1whq.vercel.app"],
  methods:["POST","GET"],
  credentials:true
}));
app.use(express.json());

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log("Database connection established");
  })
  .catch(err => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });

// Use Auth Routes
app.use("/api/auth", authRoutes);

// Use Admin Routes
app.use("/api/admin", adminRoutes);

// Attach Quiz Routes with authentication middleware
app.use("/api/quiz", verifyToken, quizRoutes);

// Add a route handler for the root path
app.get("/", (req, res) => {
  res.json({ message: "Quiz App API is running" });
});

//Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
module.exports = app;
