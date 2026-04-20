const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const auth = require('../middlewares/auth');

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (requer token)
router.get('/me', auth, me);

module.exports = router;
