const express = require("express");
const taskController = require("../controllers/tasksController");

const router = express.Router();

// Manager creates a task
router.post("/", taskController.createTask);

module.exports = router;
