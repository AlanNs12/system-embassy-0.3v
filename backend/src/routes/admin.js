const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');
const checkPlano = require('../middlewares/checkPlano');
const {
  getConfiguracoes, updateConfiguracoes, toggleModulo,
  listarUsuarios, criarUsuario, toggleUsuario,
} = require('../controllers/adminController');

// Todas as rotas exigem autenticação + perfil admin + plano vigente
router.use(auth, checkPerfil('admin'), checkPlano);

// Configurações do tenant
router.get('/configuracoes',           getConfiguracoes);
router.put('/configuracoes',           updateConfiguracoes);
router.patch('/modulos/:modulo',       toggleModulo);

// Usuários (porteiros)
router.get('/usuarios',                listarUsuarios);
router.post('/usuarios',               criarUsuario);
router.patch('/usuarios/:id/ativo',    toggleUsuario);

module.exports = router;
