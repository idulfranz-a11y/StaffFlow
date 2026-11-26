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
module.exports = router;
