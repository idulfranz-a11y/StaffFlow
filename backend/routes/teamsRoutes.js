const express = require("express");
const teamsController = require("../controllers/teamsController");

const router = express.Router();

router.post("/", teamsController.createTeam);

module.exports = router;
