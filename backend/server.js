const express = require("express");
const cors = require("cors");
const path = require("path");

const videoRoutes = require("./routes/video");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/video", videoRoutes);

app.get("/", (req, res) => {
  res.send("✔ Backend Running Successfully");
});

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
