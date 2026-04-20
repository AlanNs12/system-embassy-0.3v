const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');
const { listar, detalhe, criar, atualizar, toggleAtivo } = require('../controllers/tenantsController');

// Todas as rotas exigem autenticação + perfil super_admin
router.use(auth, checkPerfil('super_admin'));

router.get('/',        listar);
router.get('/:id',     detalhe);
router.post('/',       criar);
router.put('/:id',     atualizar);
router.patch('/:id/ativo', toggleAtivo);

module.exports = router;
