const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// GET /api/admin/configuracoes
async function getConfiguracoes(req, res) {
  const tenantId = req.user.tenant_id;
  try {
    const tenant = await pool.query(
      `SELECT id, nome, tipo, logo_url, plano, max_moradores, data_vencimento
       FROM tenants WHERE id = $1`,
      [tenantId]
    );
    const modulos = await pool.query(
      `SELECT modulo, ativo FROM tenant_modulos WHERE tenant_id = $1 ORDER BY modulo`,
      [tenantId]
    );
    return res.json({
      ...tenant.rows[0],
      modulos: modulos.rows,
    });
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// PUT /api/admin/configuracoes
async function updateConfiguracoes(req, res) {
  const tenantId = req.user.tenant_id;
  const { nome, logo_url } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome do local é obrigatório.' });
  }

  try {
    const result = await pool.query(
      `UPDATE tenants SET nome = $1, logo_url = $2 WHERE id = $3
       RETURNING id, nome, logo_url, tipo`,
      [nome.trim(), logo_url || null, tenantId]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar configurações:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// PATCH /api/admin/modulos/:modulo
async function toggleModulo(req, res) {
  const tenantId = req.user.tenant_id;
  const { modulo } = req.params;
  const { ativo } = req.body;

  const modulosValidos = ['veiculos', 'visitantes', 'prestadores', 'encomendas'];
  if (!modulosValidos.includes(modulo)) {
    return res.status(400).json({ error: 'Módulo inválido.' });
  }
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({ error: 'Campo "ativo" deve ser true ou false.' });
  }

  try {
    const result = await pool.query(
      `UPDATE tenant_modulos SET ativo = $1
       WHERE tenant_id = $2 AND modulo = $3
       RETURNING modulo, ativo`,
      [ativo, tenantId, modulo]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado para este tenant.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao alterar módulo:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// GET /api/admin/usuarios — lista porteiros do tenant
async function listarUsuarios(req, res) {
  const tenantId = req.user.tenant_id;
  try {
    const result = await pool.query(
      `SELECT id, nome, email, perfil, ativo, created_at
       FROM users
       WHERE tenant_id = $1 AND perfil != 'super_admin'
       ORDER BY nome ASC`,
      [tenantId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// POST /api/admin/usuarios — cria novo porteiro
async function criarUsuario(req, res) {
  const tenantId = req.user.tenant_id;
  const { nome, email, senha, perfil } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (!['admin', 'porteiro'].includes(perfil)) {
    return res.status(400).json({ error: 'Perfil inválido. Use "admin" ou "porteiro".' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO users (tenant_id, nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, perfil, ativo`,
      [tenantId, nome, email.toLowerCase().trim(), senhaHash, perfil]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'E-mail já está em uso.' });
    }
    console.error('Erro ao criar usuário:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// PATCH /api/admin/usuarios/:id/ativo — ativa ou desativa porteiro
async function toggleUsuario(req, res) {
  const tenantId = req.user.tenant_id;
  const { id } = req.params;
  const { ativo } = req.body;

  if (typeof ativo !== 'boolean') {
    return res.status(400).json({ error: 'Campo "ativo" deve ser true ou false.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET ativo = $1
       WHERE id = $2 AND tenant_id = $3 AND perfil != 'super_admin'
       RETURNING id, nome, ativo`,
      [ativo, id, tenantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao alterar usuário:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

module.exports = {
  getConfiguracoes,
  updateConfiguracoes,
  toggleModulo,
  listarUsuarios,
  criarUsuario,
  toggleUsuario,
};
