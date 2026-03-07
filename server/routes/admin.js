const express = require('express');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  inviteUser,
  createUser,
  deleteTournament,
  deleteMatch
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/users', getAllUsers);
router.patch('/user/:userId/role', updateUserRole);
router.delete('/user/:userId', deleteUser);
router.post('/invite', inviteUser);
router.post('/users', createUser);
router.delete('/tournament/:id', deleteTournament);
router.delete('/match/:id', deleteMatch);

module.exports = router;