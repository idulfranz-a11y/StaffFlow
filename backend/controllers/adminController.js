const db = require("../database");

const getPendingAccounts = (req, res) => {
  const sql = `
    SELECT
      id,
      first_name,
      last_name,
      id_number,
      role,
      status,
      created_at
    FROM users
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Fetching pending accounts failed:", error.message);

      return res.status(500).json({
        message: "Unable to retrieve pending accounts.",
      });
    }

    return res.status(200).json(results);
  });
};

const approveAccount = (req, res) => {
  const accountId = req.params.id;

  const sql = `
    UPDATE users
    SET status = 'active'
    WHERE id = ?
    AND status = 'pending'
    AND role IN ('manager', 'employee')
  `;

  db.query(sql, [accountId], (error, result) => {
    if (error) {
      console.error("Account approval failed:", error.message);

      return res.status(500).json({
        message: "Unable to approve account.",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Pending account not found.",
      });
    }

    return res.status(200).json({
      message: "Account approved successfully.",
    });
  });
};

const rejectAccount = (req, res) => {
  const accountId = req.params.id;

  const sql = `
    UPDATE users
    SET status = 'rejected'
    WHERE id = ?
    AND status = 'pending'
    AND role IN ('manager', 'employee')
  `;

  db.query(sql, [accountId], (error, result) => {
    if (error) {
      console.error("Account rejection failed:", error.message);

      return res.status(500).json({
        message: "Unable to reject account.",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Pending account not found.",
      });
    }

    return res.status(200).json({
      message: "Account rejected successfully.",
    });
  });
};

module.exports = {
  getPendingAccounts,
  approveAccount,
  rejectAccount,
};
