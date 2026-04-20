const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const auth = require('../middlewares/auth');

// POST /api/auth/login
router.post('/login', login);

//Teste de rota para verificar se o router está funcionando
router.get('/', (req, res) => {
  res.send('Auth funcionando');
});

// GET /api/auth/me  (requer token)
router.get('/me', auth, me);

module.exports = router;
