const express = require("express");
const db = require("../database");
const bcrypt = require("bcryptjs");

const router = express.Router();

// POST /api/login
router.post("/login", (req, res) => {
  const { id_number, password } = req.body;

  // Validate the submitted fields
  if (
    typeof id_number !== "string" ||
    typeof password !== "string" ||
    !id_number.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "Employee ID and password are required.",
    });
  }

  // Find the employee account
  const sql = `
    SELECT id, first_name, last_name, id_number, password_hash, role
    FROM users
    WHERE id_number = ?
    LIMIT 1
  `;

  db.query(sql, [id_number.trim()], async (error, results) => {
    if (error) {
      console.error("Login query failed:", error.message);

      return res.status(500).json({
        message: "Something went wrong. Please try again.",
      });
    }

    // Check whether the account exists
    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid employee ID or password.",
      });
    }

    const user = results[0];

    try {
      // Compare the password with the stored hash
      const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!passwordMatches) {
        return res.status(401).json({
          message: "Invalid employee ID or password.",
        });
      }

      // Send account details, never the password hash
      return res.status(200).json({
        message: "Login successful!",
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          id_number: user.id_number,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Password comparison failed:", error.message);

      return res.status(500).json({
        message: "Something went wrong. Please try again.",
      });
    }
  });
});

module.exports = router;
