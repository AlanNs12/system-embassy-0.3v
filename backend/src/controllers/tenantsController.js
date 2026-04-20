const pool = require('../config/database');

// GET /api/tenants — lista todos os tenants
async function listar(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, nome, tipo, logo_url, ativo, plano, max_moradores, data_vencimento, created_at
       FROM tenants
       ORDER BY nome ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar tenants:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// GET /api/tenants/:id — detalhe de um tenant
async function detalhe(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.id, t.nome, t.tipo, t.logo_url, t.ativo, t.plano, t.max_moradores, t.data_vencimento, t.created_at,
              COUNT(u.id) AS total_usuarios
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar tenant:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// POST /api/tenants — cria novo tenant + usuário admin
async function criar(req, res) {
  const {
    nome, tipo, plano, max_moradores, data_vencimento,
    admin_nome, admin_email, admin_senha,
    modulos, // array: ['veiculos', 'visitantes', 'prestadores', 'encomendas']
  } = req.body;

  if (!nome || !tipo || !plano || !data_vencimento || !admin_nome || !admin_email || !admin_senha) {
    return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cria o tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants (nome, tipo, plano, max_moradores, data_vencimento)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [nome, tipo, plano, max_moradores || null, data_vencimento]
    );
    const tenantId = tenantResult.rows[0].id;

    // Cria o usuário admin do tenant
    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash(admin_senha, 10);

    await client.query(
      `INSERT INTO users (tenant_id, nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4, 'admin')`,
      [tenantId, admin_nome, admin_email.toLowerCase().trim(), senhaHash]
    );

    // Cria os módulos (todos os 4, ativando os selecionados)
    const todoModulos = ['veiculos', 'visitantes', 'prestadores', 'encomendas'];
    for (const modulo of todoModulos) {
      const ativo = modulos ? modulos.includes(modulo) : true;
      await client.query(
        `INSERT INTO tenant_modulos (tenant_id, modulo, ativo) VALUES ($1, $2, $3)`,
        [tenantId, modulo, ativo]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({ message: 'Cliente criado com sucesso!', tenant_id: tenantId });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ error: 'E-mail do administrador já está em uso.' });
    }
    console.error('Erro ao criar tenant:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  } finally {
    client.release();
  }
}

// PUT /api/tenants/:id — atualiza dados do tenant
async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, tipo, plano, max_moradores, data_vencimento, logo_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tenants
       SET nome = COALESCE($1, nome),
           tipo = COALESCE($2, tipo),
           plano = COALESCE($3, plano),
           max_moradores = $4,
           data_vencimento = COALESCE($5, data_vencimento),
           logo_url = COALESCE($6, logo_url)
       WHERE id = $7
       RETURNING *`,
      [nome, tipo, plano, max_moradores || null, data_vencimento, logo_url, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar tenant:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// PATCH /api/tenants/:id/ativo — ativa ou desativa tenant
async function toggleAtivo(req, res) {
  const { id } = req.params;
  const { ativo } = req.body;

  if (typeof ativo !== 'boolean') {
    return res.status(400).json({ error: 'Campo "ativo" deve ser true ou false.' });
  }

  try {
    const result = await pool.query(
      `UPDATE tenants SET ativo = $1 WHERE id = $2 RETURNING id, nome, ativo`,
      [ativo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao alterar status do tenant:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

module.exports = { listar, detalhe, criar, atualizar, toggleAtivo };
