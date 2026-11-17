const express = require("express");
const path = require("path");
const session = require("express-session");

const authRoutes = require("./routes/authRoutes");
const teamsRoutes = require("./routes/teamsRoutes");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "staffflow-development-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// API routes
app.use("/api", authRoutes);
app.use("/api/teams", teamsRoutes);

// Home page

// Home page - Check existing session
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.sendFile(path.join(__dirname, "../frontend/LogIn.html"));
  }

  const role = req.session.user.role;

  const dashboards = {
    admin: "layout/adminEnd/dashboared.html",
    manager: "layout/managerEnd/manager.html",
    employee: "layout/employeeEnd/employedashboard.html",
  };

  const dashboard = dashboards[role];

  if (!dashboard) {
    return res.redirect("/LogIn.html");
  }

  return res.redirect("/" + dashboard);
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
