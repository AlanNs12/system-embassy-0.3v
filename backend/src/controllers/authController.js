const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// POST /api/auth/login
async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    // Busca o usuário pelo email
    const result = await pool.query(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.perfil, u.ativo, u.tenant_id,
              t.nome AS tenant_nome, t.tipo AS tenant_tipo, t.logo_url,
              t.ativo AS tenant_ativo, t.data_vencimento
       FROM users u
       LEFT JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const user = result.rows[0];

    // Verifica se o usuário está ativo
    if (!user.ativo) {
      return res.status(403).json({ error: 'Usuário desativado. Contate o administrador.' });
    }

    // Verifica a senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    // Verifica tenant (apenas para admin e porteiro)
    if (user.perfil !== 'super_admin') {
      if (!user.tenant_ativo) {
        return res.status(403).json({ error: 'Acesso bloqueado. Entre em contato com o suporte.' });
      }

      const hoje = new Date();
      const vencimento = new Date(user.data_vencimento);
      hoje.setHours(0, 0, 0, 0);
      vencimento.setHours(0, 0, 0, 0);

      if (vencimento < hoje) {
        return res.status(403).json({
          error: 'Plano vencido. Renove sua assinatura para continuar acessando.',
          codigo: 'PLANO_VENCIDO',
        });
      }
    }

    // Gera o token JWT
    const payload = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      tenant_id: user.tenant_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    // Retorna token + dados do usuário e tenant
    return res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        tenant_id: user.tenant_id,
        tenant_nome: user.tenant_nome,
        tenant_tipo: user.tenant_tipo,
        logo_url: user.logo_url,
      },
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// GET /api/auth/me — retorna dados do usuário logado
async function me(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nome, u.email, u.perfil, u.tenant_id,
              t.nome AS tenant_nome, t.tipo AS tenant_tipo, t.logo_url
       FROM users u
       LEFT JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro no me:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

module.exports = { login, me };
