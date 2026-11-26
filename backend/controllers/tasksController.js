const db = require("../database");
const fs = require("fs");
const path = require("path");

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

// ============================================
// Submit Work (Employee)
// ============================================

const submitWork = (req, res) => {
  // 1. Verify employee session
  if (!req.session.user || req.session.user.role !== "employee") {
    if (req.file) fs.unlink(req.file.path, () => {});

    return res.status(403).json({
      message: "Only employees can submit work.",
    });
  }

  // 2. Check uploaded file
  if (!req.file) {
    return res.status(400).json({
      message: "Please attach a file before submitting.",
    });
  }

  const employeeID = req.session.user.id;
  const taskID = req.params.taskId;

  const removeUploadedFile = () => {
    fs.unlink(req.file.path, () => {});
  };

  // 3. Verify employee assignment
  const checkAssignment = `
    SELECT ta.id AS assignment_id
    FROM tasks t
    JOIN task_assignments ta
      ON t.id = ta.task_record_id
    WHERE t.task_id = ?
      AND ta.user_id = ?
    LIMIT 1
  `;

  db.query(checkAssignment, [taskID, employeeID], (error, results) => {
    if (error) {
      removeUploadedFile();

      console.error("Assignment verification failed:", error.message);

      return res.status(500).json({
        message: "Unable to verify task assignment.",
      });
    }

    if (results.length === 0) {
      removeUploadedFile();

      return res.status(403).json({
        message: "You are not assigned to this task.",
      });
    }

    const assignmentID = results[0].assignment_id;

    // 4. Create or retrieve submission record
    const createSubmission = `
      INSERT INTO task_submissions (assignment_id)
      VALUES (?)
      ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
    `;

    db.query(createSubmission, [assignmentID], (error, result) => {
      if (error) {
        removeUploadedFile();

        console.error("Submission creation failed:", error.message);

        return res.status(500).json({
          message: "Unable to prepare your submission.",
        });
      }

      const submissionID = result.insertId;

      // 5. Check latest submission version
      const latestVersion = `
        SELECT status
        FROM submission_versions
        WHERE submission_id = ?
        ORDER BY id DESC
        LIMIT 1
      `;

      db.query(latestVersion, [submissionID], (error, versions) => {
        if (error) {
          removeUploadedFile();

          console.error("Submission check failed:", error.message);

          return res.status(500).json({
            message: "Unable to check your previous submission.",
          });
        }

        if (versions.length > 0 && versions[0].status === "Submitted") {
          removeUploadedFile();

          return res.status(409).json({
            message: "Your work is already submitted.",
          });
        }

        // 6. Save new submission version
        const insertVersion = `
          INSERT INTO submission_versions (
            submission_id,
            file_name,
            stored_name,
            file_path,
            status
          )
          VALUES (?, ?, ?, ?, 'Submitted')
        `;

        db.query(
          insertVersion,
          [
            submissionID,
            req.file.originalname,
            req.file.filename,
            req.file.path,
          ],
          (error, result) => {
            if (error) {
              removeUploadedFile();

              console.error("File submission failed:", error.message);

              return res.status(500).json({
                message: "Unable to save your submission.",
              });
            }

            return res.status(201).json({
              message: "Work submitted successfully!",
              submission: {
                id: result.insertId,
                file_name: req.file.originalname,
                status: "Submitted",
              },
            });
          },
        );
      });
    });
  });
};

// ============================================
// Return Submission for Revision (Manager)
// ============================================

const returnSubmission = (req, res) => {
  if (!req.session.user || req.session.user.role !== "manager") {
    return res.status(403).json({
      message: "Only managers can return submissions.",
    });
  }

  const managerID = req.session.user.id;
  const { taskId, versionId } = req.params;

  const checkSubmission = `
    SELECT sv.id, sv.status
    FROM submission_versions sv
    JOIN task_submissions ts
      ON sv.submission_id = ts.id
    JOIN task_assignments ta
      ON ts.assignment_id = ta.id
    JOIN tasks t
      ON ta.task_record_id = t.id
    WHERE sv.id = ?
      AND t.task_id = ?
      AND t.assigned_by = ?
      AND sv.id = (
        SELECT MAX(sv2.id)
        FROM submission_versions sv2
        WHERE sv2.submission_id = sv.submission_id
      )
    LIMIT 1
  `;

  db.query(
    checkSubmission,
    [versionId, taskId, managerID],
    (error, results) => {
      if (error) {
        console.error("Submission verification failed:", error.message);

        return res.status(500).json({
          message: "Unable to verify submission.",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Submission not found or you do not manage this task.",
        });
      }

      if (results[0].status !== "Submitted") {
        return res.status(409).json({
          message: "This submission cannot be returned.",
        });
      }

      // Update only the submission status
      const updateStatus = `
        UPDATE submission_versions
        SET status = 'Returned for revision'
        WHERE id = ?
          AND status = 'Submitted'
      `;

      db.query(updateStatus, [versionId], (error, result) => {
        if (error) {
          console.error("Submission update failed:", error.message);

          return res.status(500).json({
            message: "Unable to return submission.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(409).json({
            message: "Submission status has already changed.",
          });
        }

        return res.json({
          message: "Submission returned for revision.",
          submission: {
            id: Number(versionId),
            status: "Returned for revision",
          },
        });
      });
    },
  );
};

// ============================================
// Get Submission Versions (Manager)
// ============================================

const getSubmissions = (req, res) => {
  if (!req.session.user || req.session.user.role !== "manager") {
    return res.status(403).json({
      message: "Only managers can view submissions.",
    });
  }

  const managerID = req.session.user.id;
  const taskID = req.params.taskId;

  const query = `
    SELECT
      sv.id AS version_id,
      sv.file_name,
      sv.status,
      sv.submitted_at,
      u.first_name,
      u.last_name
    FROM tasks t
    JOIN task_assignments ta
      ON t.id = ta.task_record_id
    JOIN users u
      ON ta.user_id = u.id
    JOIN task_submissions ts
      ON ta.id = ts.assignment_id
    JOIN submission_versions sv
      ON ts.id = sv.submission_id
    WHERE t.task_id = ?
      AND t.assigned_by = ?
    ORDER BY u.last_name ASC, sv.id DESC
  `;

  db.query(query, [taskID, managerID], (error, results) => {
    if (error) {
      console.error("Submission retrieval failed:", error.message);

      return res.status(500).json({
        message: "Unable to retrieve submissions.",
      });
    }

    return res.json({
      submissions: results.map((row) => ({
        version_id: row.version_id,
        file_name: row.file_name,
        status: row.status,
        submitted_at: row.submitted_at,
        employee_name: `${row.first_name} ${row.last_name}`,
      })),
    });
  });
};

// ============================================
// Preview Submission (Manager)
// ============================================

const previewSubmission = (req, res) => {
  // 1. Verify manager session
  if (!req.session.user || req.session.user.role !== "manager") {
    return res.status(403).json({
      message: "Only managers can preview submissions.",
    });
  }

  const managerID = req.session.user.id;
  const { taskId, versionId } = req.params;

  // 2. Verify task ownership and retrieve file
  const query = `
    SELECT sv.file_path, sv.file_name
    FROM submission_versions sv
    JOIN task_submissions ts
      ON sv.submission_id = ts.id
    JOIN task_assignments ta
      ON ts.assignment_id = ta.id
    JOIN tasks t
      ON ta.task_record_id = t.id
    WHERE sv.id = ?
      AND t.task_id = ?
      AND t.assigned_by = ?
    LIMIT 1
  `;

  db.query(query, [versionId, taskId, managerID], (error, results) => {
    if (error) {
      console.error("Preview verification failed:", error.message);

      return res.status(500).json({
        message: "Unable to retrieve submission.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Submission not found.",
      });
    }

    const file = results[0];
    const extension = path.extname(file.file_name).toLowerCase();

    // 3. Allow only browser-previewable formats
    const allowedTypes = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
    };

    const contentType = allowedTypes[extension];

    if (!contentType) {
      return res.status(415).json({
        message: "This file type cannot be previewed in the browser.",
      });
    }

    // 4. Ensure the file is inside the submissions folder
    const uploadDirectory = path.resolve(__dirname, "../uploads/submissions");

    const filePath = path.resolve(file.file_path);
    const relativePath = path.relative(uploadDirectory, filePath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      return res.status(403).json({
        message: "Invalid file location.",
      });
    }

    // 5. Display file inside the browser
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) {
        console.error("Preview failed:", error.message);

        return res.status(404).json({
          message: "The submitted file could not be found.",
        });
      }
    });
  });
};

// ============================================
// Export Controllers
// ============================================

module.exports = {
  createTask,
  submitWork,
  returnSubmission,
  getSubmissions,
  previewSubmission,
};
