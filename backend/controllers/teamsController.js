const db = require("../database");
const crypto = require("crypto");

// ============================================
// Generate a unique team code
// ============================================

const generateUniqueCode = (callback) => {
  const accessCode =
    "TEAM-" + crypto.randomBytes(3).toString("hex").toUpperCase();

  const sql = `
    SELECT id FROM teams
    WHERE access_code = ?
    LIMIT 1
  `;

  db.query(sql, [accessCode], (error, results) => {
    if (error) {
      return callback(error);
    }

    if (results.length > 0) {
      return generateUniqueCode(callback);
    }

    callback(null, accessCode);
  });
};

// ============================================
// Get all teams belonging to the logged-in manager
// ============================================

const getTeams = (req, res) => {
  // Verify manager session
  if (!req.session.user || req.session.user.role !== "manager") {
    return res.status(403).json({
      message: "Only authenticated managers can view teams.",
    });
  }

  const manager_id = req.session.user.id;

  const sql = `
    SELECT
      t.id,
      t.team_name AS name,
      t.access_code AS code,
      (
        SELECT COUNT(*)
        FROM team_members tm
        WHERE tm.team_id = t.id
      ) AS members,
      t.created_at
    FROM teams t
    WHERE t.manager_id = ?
    ORDER BY t.created_at DESC
  `;

  db.query(sql, [manager_id], (error, results) => {
    if (error) {
      console.error("Loading teams failed:", error.message);

      return res.status(500).json({
        message: "Unable to load teams.",
      });
    }

    return res.status(200).json({
      teams: results,
    });
  });
};

// ============================================
// Create a new team
// ============================================

const createTeam = (req, res) => {
  // Verify manager session
  if (!req.session.user || req.session.user.role !== "manager") {
    return res.status(403).json({
      message: "Only authenticated managers can create teams.",
    });
  }

  const manager_id = req.session.user.id;
  const { team_name } = req.body;

  // Validate team name
  if (typeof team_name !== "string" || !team_name.trim()) {
    return res.status(400).json({
      message: "Team name is required.",
    });
  }

  const cleanName = team_name.trim();

  if (cleanName.length > 100) {
    return res.status(400).json({
      message: "Team name must not exceed 100 characters.",
    });
  }

  // Verify manager exists
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

    // Generate a unique team code
    generateUniqueCode((error, accessCode) => {
      if (error) {
        console.error("Code generation failed:", error.message);

        return res.status(500).json({
          message: "Unable to generate a team code.",
        });
      }

      // Save team in MySQL
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
            manager_id: manager_id,
            name: cleanName,
            code: accessCode,
            members: 0,
          },
        });
      });
    });
  });
};

// ============================================
// Export Controller Functions
// ============================================

module.exports = {
  getTeams,
  createTeam,
};
