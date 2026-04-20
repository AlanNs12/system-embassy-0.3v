// Verifica se o usuário tem um dos perfis permitidos
// Uso: router.get('/rota', auth, checkPerfil('super_admin'), controller)
//      router.get('/rota', auth, checkPerfil('admin', 'super_admin'), controller)

module.exports = function checkPerfil(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (!perfisPermitidos.includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Acesso não permitido para este perfil.' });
    }

    next();
  };
};
