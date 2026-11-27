const db = require("../database");
const bcrypt = require("bcryptjs");

const login = (req, res) => {
  const { id_number, password } = req.body;

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

  const sql = `
    SELECT id, first_name, last_name, id_number, password_hash, role, status
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

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid employee ID or password.",
      });
    }

    const user = results[0];

    // Check account status before allowing login.
    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is pending approval or inactive.",
      });
    }

    try {
      const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!passwordMatches) {
        return res.status(401).json({
          message: "Invalid employee ID or password.",
        });
      }

      // Create employee/manager session
      req.session.user = {
        id: user.id,
        role: user.role,
      };

      // Save session before sending login response
      req.session.save((sessionError) => {
        if (sessionError) {
          console.error("Session save failed:", sessionError.message);

          return res.status(500).json({
            message: "Unable to establish login session.",
          });
        }

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
      });
    } catch (error) {
      console.error("Password comparison failed:", error.message);

      return res.status(500).json({
        message: "Something went wrong. Please try again.",
      });
    }
  });
};

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
