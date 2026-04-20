const pool = require('../config/database');

// Verifica se o tenant do usuário está ativo e com plano vigente
// Aplicado automaticamente após o authMiddleware para admin e porteiro
module.exports = async function checkPlano(req, res, next) {
  // super_admin não tem tenant, passa direto
  if (req.user.perfil === 'super_admin') return next();

  const tenantId = req.user.tenant_id;

  if (!tenantId) {
    return res.status(403).json({ error: 'Usuário sem tenant associado.' });
  }

  try {
    const result = await pool.query(
      'SELECT ativo, data_vencimento FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Tenant não encontrado.' });
    }

    const tenant = result.rows[0];

    if (!tenant.ativo) {
      return res.status(403).json({ error: 'Acesso bloqueado. Entre em contato com o suporte.' });
    }

    const hoje = new Date();
    const vencimento = new Date(tenant.data_vencimento);
    // Zera hora para comparar só a data
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);

    if (vencimento < hoje) {
      return res.status(403).json({
        error: 'Plano vencido. Renove sua assinatura para continuar acessando.',
        codigo: 'PLANO_VENCIDO',
      });
    }

    next();
  } catch (err) {
    console.error('Erro no checkPlano:', err);
    return res.status(500).json({ error: 'Erro ao verificar plano.' });
  }
};
