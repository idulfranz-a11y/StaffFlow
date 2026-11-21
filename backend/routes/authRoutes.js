const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// POST /api/login
router.post("/login", authController.login);

// POST /api/register
router.post("/register", authController.register);

// POST /api/logout
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error);

      return res.status(500).json({
        message: "Unable to log out.",
      });
    }

    res.clearCookie("connect.sid");

    return res.status(200).json({
      message: "Logged out successfully.",
    });
  });
});

module.exports = router;
