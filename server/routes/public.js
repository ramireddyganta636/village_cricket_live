const express = require('express');
const {
  getTournaments,
  getTournamentMatches,
  getMatch,
  getTeamsByTournament,
  getAllMatches,
  getPlayerStats,
  getPointsTable,
  getPlayersByTeam
} = require('../controllers/publicController');

const router = express.Router();

router.get('/tournaments', getTournaments);
router.get('/tournament/:tournamentId/matches', getTournamentMatches);
router.get('/match/:id', getMatch);
router.get('/tournament/:tournamentId/teams', getTeamsByTournament);
router.get('/matches', getAllMatches);
router.get('/match/:matchId/stats', getPlayerStats);
router.get('/tournament/:tournamentId/points', getPointsTable);
router.get('/team/:teamId/players', getPlayersByTeam);
module.exports = router;