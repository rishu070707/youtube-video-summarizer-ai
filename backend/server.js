const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const videoRoutes = require("./routes/video");
const downloadRoutes = require("./routes/download");

const app = express();

// DB
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/video", videoRoutes);
app.use("/api/download", downloadRoutes);

// health check (IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("AI Video Summarizer Backend Running");
});

// ✅ FIXED PORT HANDLING FOR RENDER
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
