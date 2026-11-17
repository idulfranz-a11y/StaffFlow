const express = require("express");
const teamsController = require("../controllers/teamsController");

const router = express.Router();

// GET all teams
router.get("/", teamsController.getTeams);

// POST create a team
router.post("/", teamsController.createTeam);

module.exports = router;
