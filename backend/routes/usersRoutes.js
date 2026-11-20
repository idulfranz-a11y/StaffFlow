const express = require("express");
const router = express.Router();
const db = require("../database");

router.get("/", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Please log in first.",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  const sql = `
    SELECT id, first_name, last_name, id_number, role
    FROM users
    ORDER BY id DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error(error.message);

      return res.status(500).json({
        message: "Failed to retrieve accounts.",
      });
    }

    res.json(results);
  });
});

module.exports = router;
