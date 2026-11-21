const db = require("../database");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  const { first_name, last_name, id_number, password, role } = req.body;

  if (
    typeof first_name !== "string" ||
    typeof last_name !== "string" ||
    typeof id_number !== "string" ||
    typeof password !== "string" ||
    typeof role !== "string" ||
    !first_name.trim() ||
    !last_name.trim() ||
    !id_number.trim() ||
    !password.trim() ||
    !role.trim()
  ) {
    return res.status(400).json({
      message: "Please provide all required information.",
    });
  }
  const allowedRoles = ["manager", "employee"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      message: "Invalid requested role.",
    });
  }

  const sql = `
    SELECT id_number
    FROM users
    WHERE id_number = ?
    LIMIT 1
    `;

  db.query(sql, [id_number.trim()], async (error, results) => {
    if (error) {
      console.error("Registration query failed:", error.message);

      return res.status(500).json({
        message: "Something went wrong. Please try again.",
      });
    }

    if (results.length > 0) {
      return res.status(409).json({
        message: "Account ID is already registered.",
      });
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);

      const insertSql = `
  INSERT INTO users
  (first_name, last_name, id_number, password_hash, role, status)
  VALUES (?, ?, ?, ?, ?, 'pending')
`;

      db.query(
        insertSql,
        [
          first_name.trim(),
          last_name.trim(),
          id_number.trim(),
          passwordHash,
          role,
        ],
        (insertError, result) => {
          if (insertError) {
            console.error("Registration insert failed:", insertError.message);

            if (insertError.code === "ER_DUP_ENTRY") {
              return res.status(409).json({
                message: "Account ID is already registered.",
              });
            }

            return res.status(500).json({
              message: "Something went wrong. Please try again.",
            });
          }

          return res.status(201).json({
            message: "Registration submitted. Waiting for admin approval.",
          });
        },
      );
    } catch (error) {
      console.error("Password hashing failed:", error.message);

      return res.status(500).json({
        message: "Something went wrong. Please try again.",
      });
    }
  });
};

module.exports = { login, register };
