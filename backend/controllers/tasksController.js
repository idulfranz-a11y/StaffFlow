const db = require("../database");

// ============================================
// Create a Task (Manager)
// ============================================

const createTask = (req, res) => {
  // 1. Verify manager session
  if (!req.session.user || req.session.user.role !== "manager") {
    return res.status(403).json({
      message: "Only managers can create tasks.",
    });
  }

  const manager_id = req.session.user.id;

  const { title, description, team_id, priority, deadline, assigned_members } =
    req.body;

  // 2. Validate required information
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      message: "Task title is required.",
    });
  }

  if (title.trim().length > 150) {
    return res.status(400).json({
      message: "Task title must not exceed 150 characters.",
    });
  }

  if (!team_id || !Number.isInteger(Number(team_id))) {
    return res.status(400).json({
      message: "Please select a valid team.",
    });
  }

  if (!deadline) {
    return res.status(400).json({
      message: "Task deadline is required.",
    });
  }

  if (!Array.isArray(assigned_members) || assigned_members.length === 0) {
    return res.status(400).json({
      message: "Please assign the task to at least one employee.",
    });
  }

  const allowedPriorities = ["Low", "Medium", "High"];

  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({
      message: "Invalid task priority.",
    });
  }

  const cleanTitle = title.trim();
  const cleanDescription =
    typeof description === "string" ? description.trim() : "";

  const selectedTeam = Number(team_id);
  const employeeIDs = [...new Set(assigned_members.map(Number))];

  if (employeeIDs.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    return res.status(400).json({
      message: "Invalid employee selection.",
    });
  }

  // 3. Verify that the team belongs to this manager
  const checkTeam = `
    SELECT id
    FROM teams
    WHERE id = ? AND manager_id = ?
    LIMIT 1
  `;

  db.query(checkTeam, [selectedTeam, manager_id], (error, teams) => {
    if (error) {
      console.error("Team verification failed:", error.message);

      return res.status(500).json({
        message: "Unable to verify the selected team.",
      });
    }

    if (teams.length === 0) {
      return res.status(403).json({
        message: "You do not own this team.",
      });
    }

    // 4. Verify that all selected employees belong to the team
    const placeholders = employeeIDs.map(() => "?").join(", ");

    const checkMembers = `
      SELECT tm.user_id
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
        AND tm.user_id IN (${placeholders})
        AND u.role = 'employee'
    `;

    db.query(checkMembers, [selectedTeam, ...employeeIDs], (error, members) => {
      if (error) {
        console.error("Employee verification failed:", error.message);

        return res.status(500).json({
          message: "Unable to verify selected employees.",
        });
      }

      if (members.length !== employeeIDs.length) {
        return res.status(400).json({
          message: "One or more selected employees do not belong to this team.",
        });
      }

      // 5. Begin database transaction
      db.beginTransaction((error) => {
        if (error) {
          console.error("Transaction failed:", error.message);

          return res.status(500).json({
            message: "Unable to start task creation.",
          });
        }

        // 6. Insert main task
        const insertTask = `
            INSERT INTO tasks (
              task_id,
              title,
              description,
              assigned_by,
              team_id,
              deadline,
              priority
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

        // Temporary reference; update after obtaining insertId
        const temporaryTaskID = `TEMP-${Date.now()}`;

        db.query(
          insertTask,
          [
            temporaryTaskID,
            cleanTitle,
            cleanDescription,
            manager_id,
            selectedTeam,
            deadline,
            priority,
          ],
          (error, result) => {
            if (error) {
              return db.rollback(() => {
                console.error("Task insertion failed:", error.message);

                return res.status(500).json({
                  message: "Unable to create task.",
                });
              });
            }

            const taskRecordID = result.insertId;
            const finalTaskID = `TASK-${String(taskRecordID).padStart(4, "0")}`;

            // 7. Update task reference
            const updateTaskID = `
                UPDATE tasks
                SET task_id = ?
                WHERE id = ?
              `;

            db.query(updateTaskID, [finalTaskID, taskRecordID], (error) => {
              if (error) {
                return db.rollback(() => {
                  console.error("Task ID update failed:", error.message);

                  return res.status(500).json({
                    message: "Unable to generate task reference.",
                  });
                });
              }

              // 8. Create one assignment for each employee
              const assignmentValues = employeeIDs.map((employeeID) => [
                taskRecordID,
                employeeID,
              ]);

              const insertAssignments = `
                    INSERT INTO task_assignments (
                      task_record_id,
                      user_id
                    )
                    VALUES ?
                  `;

              db.query(insertAssignments, [assignmentValues], (error) => {
                if (error) {
                  return db.rollback(() => {
                    console.error(
                      "Assignment insertion failed:",
                      error.message,
                    );

                    return res.status(500).json({
                      message: "Unable to assign task to employees.",
                    });
                  });
                }

                // 9. Commit transaction
                db.commit((error) => {
                  if (error) {
                    return db.rollback(() => {
                      console.error(
                        "Transaction commit failed:",
                        error.message,
                      );

                      return res.status(500).json({
                        message: "Unable to save task.",
                      });
                    });
                  }

                  return res.status(201).json({
                    message: "Task created successfully!",
                    task: {
                      id: taskRecordID,
                      task_id: finalTaskID,
                      title: cleanTitle,
                      team_id: selectedTeam,
                      assigned_members: employeeIDs,
                    },
                  });
                });
              });
            });
          },
        );
      });
    });
  });
};

module.exports = {
  createTask,
};
