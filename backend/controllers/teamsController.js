const db = require("../database");
const crypto = require("crypto");

const createTeam = (req, res) => {
  const { team_name, manager_id } = req.body;

  // Validate input
  if (
    typeof team_name !== "string" ||
    !team_name.trim() ||
    !Number.isInteger(Number(manager_id))
  ) {
    return res.status(400).json({
      message: "Team name and valid manager ID are required.",
    });
  }

  const cleanName = team_name.trim();

  if (cleanName.length > 100) {
    return res.status(400).json({
      message: "Team name must not exceed 100 characters.",
    });
  }

  // Check if the manager exists
  const checkManager = `
    SELECT id FROM users
    WHERE id = ? AND role = 'manager'
    LIMIT 1
  `;

  db.query(checkManager, [manager_id], (error, results) => {
    if (error) {
      console.error("Manager lookup failed:", error.message);
      return res.status(500).json({
        message: "Something went wrong.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Manager not found.",
      });
    }

    // Generate a unique access code
    const accessCode =
      "TEAM-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    // Save the team in MySQL
    const sql = `
      INSERT INTO teams (manager_id, team_name, access_code)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [manager_id, cleanName, accessCode], (error, result) => {
      if (error) {
        console.error("Team creation failed:", error.message);

        return res.status(500).json({
          message: "Unable to create team.",
        });
      }

      return res.status(201).json({
        message: "Team created successfully!",
        team: {
          id: result.insertId,
          manager_id: Number(manager_id),
          team_name: cleanName,
          access_code: accessCode,
          members: 0,
        },
      });
    });
  });
};

module.exports = { createTeam };
