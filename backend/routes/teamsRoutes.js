const express = require("express");
const teamsController = require("../controllers/teamsController");

const router = express.Router();

// Manager routes
router.get("/", teamsController.getTeams);
router.post("/", teamsController.createTeam);

// Employee routes
router.post("/join", teamsController.joinTeam);
router.get("/my-team", teamsController.getMyTeam);

router.get("/:teamId/members", teamsController.getTeamMembers);

module.exports = router;
