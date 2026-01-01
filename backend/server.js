const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const videoRoutes = require("./routes/video");
const downloadRoutes = require("./routes/download");

const app = express();

// DB connect
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// ROUTES (IMPORTANT)
app.use("/api/video", videoRoutes);
app.use("/api/download", downloadRoutes); // 🔥 THIS LINE IS MUST

app.get("/", (req, res) => {
  res.send("✅ AI Video Summarizer Backend Running");
});

const PORT = 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
