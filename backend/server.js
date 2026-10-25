const express = require("express");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/api", authRoutes);

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/LogIn.html"));
});

// Test database connection
app.get("/api/db-test", (req, res) => {
  const db = require("./database");

  db.query("SELECT 1 AS result", (error, results) => {
    if (error) {
      console.error("Database query failed:", error.message);

      return res.status(500).json({
        message: "Database query failed",
      });
    }

    res.json({
      message: "Express is connected to MySQL!",
      result: results[0].result,
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
