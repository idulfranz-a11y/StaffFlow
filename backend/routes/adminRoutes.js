const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

// Middleware: Only admins can access these routes.
const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Please log in first.",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
};

// GET pending registration requests
router.get(
  "/pending-accounts",
  requireAdmin,
  adminController.getPendingAccounts,
);
router.patch("/:id/approve", requireAdmin, adminController.approveAccount);

// Reject account
router.patch("/:id/reject", requireAdmin, adminController.rejectAccount);

module.exports = router;
