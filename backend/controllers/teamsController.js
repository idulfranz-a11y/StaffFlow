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
// Employee joins a team
// ============================================

const joinTeam = (req, res) => {
  // Verify employee session
  if (!req.session.user || req.session.user.role !== "employee") {
    return res.status(403).json({
      message: "Only authenticated employees can join teams.",
    });
  }

  const user_id = req.session.user.id;
  const { access_code } = req.body;

  // Validate team code
  if (typeof access_code !== "string" || !access_code.trim()) {
    return res.status(400).json({
      message: "Please enter a team code.",
    });
  }

  const cleanCode = access_code.trim().toUpperCase();

  // Find team using its access code
  const findTeam = `
      SELECT id, team_name
      FROM teams
      WHERE access_code = ?
      LIMIT 1
    `;

  db.query(findTeam, [cleanCode], (error, results) => {
    if (error) {
      console.error("Team lookup failed:", error.message);
      return res.status(500).json({
        message: "Something went wrong.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Invalid team code.",
      });
    }

    const team = results[0];

    // Check if employee already belongs to a team
    const checkMembership = `
        SELECT team_id
        FROM team_members
        WHERE user_id = ?
        LIMIT 1
      `;

    db.query(checkMembership, [user_id], (error, membership) => {
      if (error) {
        console.error("Membership check failed:", error.message);
        return res.status(500).json({
          message: "Unable to verify your team membership.",
        });
      }

      if (membership.length > 0) {
        return res.status(409).json({
          message: "You already belong to a team. You can only join one team.",
        });
      }

      // Add employee to the team
      const insertMember = `
          INSERT INTO team_members (team_id, user_id)
          VALUES (?, ?)
        `;

      db.query(insertMember, [team.id, user_id], (error) => {
        if (error) {
          console.error("Joining team failed:", error.message);
          return res.status(500).json({
            message: "Unable to join team.",
          });
        }

        return res.status(201).json({
          message: "You joined the team successfully!",
          team: {
            id: team.id,
            name: team.team_name,
          },
        });
      });
    });
  });
};

// ============================================
// Get the logged-in employee's current team
// ============================================

const getMyTeam = (req, res) => {
  // Verify employee session
  if (!req.session.user || req.session.user.role !== "employee") {
    return res.status(403).json({
      message: "Only authenticated employees can view their team.",
    });
  }

  const user_id = req.session.user.id;

  const sql = `
    SELECT
      t.id AS team_id,
      t.team_name AS team_name,
      manager.first_name AS manager_first_name,
      manager.last_name AS manager_last_name,
      member.id AS member_id,
      member.first_name AS member_first_name,
      member.last_name AS member_last_name,
      member.role AS member_role
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN users manager ON t.manager_id = manager.id
    JOIN team_members all_members ON all_members.team_id = t.id
    JOIN users member ON all_members.user_id = member.id
    WHERE tm.user_id = ?
    ORDER BY member.first_name ASC
  `;

  db.query(sql, [user_id], (error, results) => {
    if (error) {
      console.error("Loading employee team failed:", error.message);

      return res.status(500).json({
        message: "Unable to load your team.",
      });
    }

    if (results.length === 0) {
      return res.status(200).json({
        team: null,
        message: "You have not joined a team yet.",
      });
    }

    const first = results[0];

    const team = {
      id: first.team_id,
      name: first.team_name,
      manager: `${first.manager_first_name} ${first.manager_last_name}`,
      members: results.map((row) => ({
        id: row.member_id,
        name: `${row.member_first_name} ${row.member_last_name}`,
        role: row.member_role,
      })),
    };

    return res.status(200).json({ team });
  });
};

// ============================================
// Export Controller Functions
// ============================================

module.exports = {
  getTeams,
  createTeam,
  joinTeam,
  getMyTeam,
};
