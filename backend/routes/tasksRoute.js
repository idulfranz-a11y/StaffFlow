const express = require("express");
const taskController = require("../controllers/tasksController");
const upload = require("../middleWare/uploadmiddleWare");

const router = express.Router();

// Manager creates a task
router.post("/", taskController.createTask);

// Employee submits work
router.post(
  "/:taskId/submit",
  upload.single("submission"),
  taskController.submitWork,
);
// Manager returns work for revision
router.patch(
  "/:taskId/submissions/:versionId/return",
  taskController.returnSubmission,
);
// Manager views submission versions
router.get("/:taskId/submissions", taskController.getSubmissions);

router.get(
  "/:taskId/submissions/:versionId/preview",
  taskController.previewSubmission,
);

router.get("/my-tasks", taskController.getMyTasks);

router.get("/my-created-tasks", taskController.getMyCreatedTasks);
router.get("/:taskId/comments", taskController.getTaskComments);
router.post("/:taskId/comments", taskController.createTaskComment);

// Employee submits a progress update
router.post("/:taskId/progress", taskController.createTaskProgress);

// Manager views progress updates
router.get("/:taskId/progress", taskController.getTaskProgress);
router.get(
  "/:taskId/submissions/:versionId/download",
  taskController.downloadSubmission,
);
router.patch("/:taskId/status", taskController.updateTaskStatus);

module.exports = router;
