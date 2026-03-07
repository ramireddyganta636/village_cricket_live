const express = require('express');
const { protect } = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');
const {
  createTournament,
  createTeam,
  addPlayer,
  createMatch,
  startMatch,
  endMatch,
  addBall,
  getAllTeams,
  getAllPlayers,
  deleteTeam,
  deletePlayer
} = require('../controllers/managerController');

const router = express.Router();

router.use(protect, checkSubscription);

router.post('/tournament', createTournament);
router.post('/team', createTeam);
router.post('/player', addPlayer);
router.post('/match', createMatch);
router.patch('/match/:id/start', startMatch);
router.patch('/match/:id/end', endMatch);
router.post('/match/:matchId/ball', addBall);
router.get('/teams', getAllTeams);
router.delete('/team/:teamId', deleteTeam);
router.get('/players', getAllPlayers);
router.delete('/player/:playerId', deletePlayer);

module.exports = router;