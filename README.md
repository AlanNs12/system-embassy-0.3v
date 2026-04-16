# 🏢 Portaria SaaS

Sistema de controle de portaria multi-tenant para condomínios, embaixadas e locais públicos.

## 📦 Stack

- **Frontend:** React + Tailwind CSS (mobile-first)
- **Backend:** Node.js + Express
- **Banco de dados:** PostgreSQL (VPS)
- **Autenticação:** JWT

## 👥 Perfis de usuário

| Perfil | Descrição |
|--------|-----------|
| `super_admin` | Gerencia todos os tenants/clientes |
| `admin` | Configura o local, módulos e cadastros |
| `porteiro` | Operação diária da portaria |

## 🏢 Tipos de local

| Tipo | Módulo de pessoas |
|------|------------------|
| `publico` | Funcionários |
| `condominio` | Moradores, Proprietários, Inquilinos |

## 📦 Módulos disponíveis

- Funcionários / Moradores
- Veículos + Motoristas
- Visitantes
- Prestadores de Serviço
- Encomendas (+ notificação WhatsApp)

## 📁 Estrutura do projeto

```
portaria-saas/
├── frontend/           # React App
│   └── src/
│       ├── pages/      # Telas por perfil/módulo
│       ├── components/ # Componentes reutilizáveis
│       ├── services/   # Chamadas à API
│       ├── contexts/   # Context API (auth, tenant)
│       ├── hooks/      # Custom hooks
│       └── utils/      # Funções utilitárias
│
└── backend/            # API REST
    ├── src/
    │   ├── routes/         # Endpoints por módulo
    │   ├── controllers/    # Lógica dos endpoints
    │   ├── models/         # Queries do banco
    │   ├── middlewares/    # Auth, tenant, plano
    │   ├── config/         # Banco, env, constantes
    │   └── utils/          # Funções utilitárias
    └── migrations/         # Scripts SQL do banco
```

## 🚀 Como rodar localmente

### Backend
```bash
cd backend
npm install
cp .env.example .env   # preencher variáveis
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # preencher variáveis
npm start
```
## Banco de Dados - Script

```bash
-- ============================================================
-- PORTARIA SAAS — SCRIPT COMPLETO DO BANCO DE DADOS
-- Execute este arquivo no DBeaver para criar todas as tabelas
-- Ordem de execução já está correta (respeita dependências)
-- ============================================================


-- ============================================================
-- 01 - TENANTS
-- ============================================================

CREATE TABLE tenants (
  id               SERIAL PRIMARY KEY,
  nome             VARCHAR(150)  NOT NULL,
  tipo             VARCHAR(20)   NOT NULL CHECK (tipo IN ('publico', 'condominio')),
  logo_url         TEXT,
  ativo            BOOLEAN       NOT NULL DEFAULT TRUE,
  plano            VARCHAR(20)   NOT NULL CHECK (plano IN ('fixo', 'por_moradores')),
  max_moradores    INTEGER,
  data_vencimento  DATE          NOT NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN tenants.tipo            IS 'publico = embaixada/empresa | condominio = residencial';
COMMENT ON COLUMN tenants.plano           IS 'fixo = valor único | por_moradores = escalonado por qtd moradores';
COMMENT ON COLUMN tenants.max_moradores   IS 'Limite de moradores no plano contratado';
COMMENT ON COLUMN tenants.data_vencimento IS 'Acesso bloqueado no login se vencido e não renovado';


-- ============================================================
-- 02 - USERS
-- ============================================================

CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER      REFERENCES tenants(id) ON DELETE CASCADE,
  nome         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  senha_hash   TEXT         NOT NULL,
  perfil       VARCHAR(20)  NOT NULL CHECK (perfil IN ('super_admin', 'admin', 'porteiro')),
  ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email  ON users(email);

COMMENT ON COLUMN users.tenant_id IS 'NULL somente para perfil super_admin';

-- Usuário Super Admin inicial (TROQUE A SENHA NO PRIMEIRO ACESSO!)
-- Senha padrão: superadmin123
INSERT INTO users (tenant_id, nome, email, senha_hash, perfil)
VALUES (
  NULL,
  'Super Admin',
  'superadmin@portaria.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'super_admin'
);


-- ============================================================
-- 03 - TENANT_MODULOS
-- ============================================================

CREATE TABLE tenant_modulos (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER     NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  modulo     VARCHAR(30) NOT NULL CHECK (modulo IN ('veiculos', 'visitantes', 'prestadores', 'encomendas')),
  ativo      BOOLEAN     NOT NULL DEFAULT TRUE,
  UNIQUE(tenant_id, modulo)
);

CREATE INDEX idx_tenant_modulos_tenant ON tenant_modulos(tenant_id);


-- ============================================================
-- 04 - PESSOAS
-- ============================================================

CREATE TABLE pessoas (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        VARCHAR(150) NOT NULL,
  tipo        VARCHAR(20)  NOT NULL CHECK (tipo IN ('funcionario', 'morador', 'proprietario', 'inquilino')),
  documento   VARCHAR(30),
  telefone    VARCHAR(20),
  email       VARCHAR(150),
  foto_url    TEXT,
  unidade     VARCHAR(20),
  bloco       VARCHAR(20),
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pessoas_tenant ON pessoas(tenant_id);
CREATE INDEX idx_pessoas_tipo   ON pessoas(tenant_id, tipo);

COMMENT ON COLUMN pessoas.tipo    IS 'funcionario: local público | morador/proprietario/inquilino: condomínio';
COMMENT ON COLUMN pessoas.unidade IS 'Número do apartamento/unidade (somente condomínio)';
COMMENT ON COLUMN pessoas.bloco   IS 'Bloco do condomínio (somente condomínio)';


-- ============================================================
-- 04b - IMOVEIS (vínculo proprietário <-> inquilino)
-- ============================================================

CREATE TABLE imoveis (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  unidade         VARCHAR(20) NOT NULL,
  bloco           VARCHAR(20),
  proprietario_id INTEGER     REFERENCES pessoas(id) ON DELETE SET NULL,
  inquilino_id    INTEGER     REFERENCES pessoas(id) ON DELETE SET NULL,
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_imoveis_tenant ON imoveis(tenant_id);


-- ============================================================
-- 05 - VEICULOS
-- ============================================================

CREATE TABLE veiculos (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pessoa_id  INTEGER      REFERENCES pessoas(id) ON DELETE SET NULL,
  placa      VARCHAR(15)  NOT NULL,
  modelo     VARCHAR(80),
  cor        VARCHAR(40),
  ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_veiculos_tenant ON veiculos(tenant_id);
CREATE INDEX idx_veiculos_placa  ON veiculos(tenant_id, placa);


-- ============================================================
-- 05b - REGISTROS DE VEÍCULOS
-- ============================================================

CREATE TABLE registros_veiculos (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  veiculo_id      INTEGER      REFERENCES veiculos(id) ON DELETE SET NULL,
  placa_avulsa    VARCHAR(15),
  motorista_id    INTEGER      REFERENCES pessoas(id) ON DELETE SET NULL,
  motorista_nome  VARCHAR(150),
  tipo            VARCHAR(10)  NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  data_hora       TIMESTAMP    NOT NULL DEFAULT NOW(),
  observacao      TEXT,
  registrado_por  INTEGER      REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reg_veiculos_tenant    ON registros_veiculos(tenant_id);
CREATE INDEX idx_reg_veiculos_data_hora ON registros_veiculos(tenant_id, data_hora DESC);

COMMENT ON COLUMN registros_veiculos.placa_avulsa  IS 'Preenchido quando veículo não está cadastrado';
COMMENT ON COLUMN registros_veiculos.motorista_nome IS 'Preenchido quando motorista não está cadastrado';


-- ============================================================
-- 06 - REGISTROS DE ACESSO DE PESSOAS
-- ============================================================

CREATE TABLE registros_acesso (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pessoa_id       INTEGER      NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  tipo            VARCHAR(10)  NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  data_hora       TIMESTAMP    NOT NULL DEFAULT NOW(),
  observacao      TEXT,
  registrado_por  INTEGER      REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reg_acesso_tenant    ON registros_acesso(tenant_id);
CREATE INDEX idx_reg_acesso_pessoa    ON registros_acesso(tenant_id, pessoa_id);
CREATE INDEX idx_reg_acesso_data_hora ON registros_acesso(tenant_id, data_hora DESC);


-- ============================================================
-- 07 - VISITANTES
-- ============================================================

CREATE TABLE visitantes (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome                VARCHAR(150) NOT NULL,
  documento           VARCHAR(30),
  telefone            VARCHAR(20),
  foto_url            TEXT,
  motivo              TEXT,
  visita_para_id      INTEGER      REFERENCES pessoas(id) ON DELETE SET NULL,
  visita_para_nome    VARCHAR(150),
  data_hora_entrada   TIMESTAMP    NOT NULL DEFAULT NOW(),
  data_hora_saida     TIMESTAMP,
  observacao          TEXT,
  registrado_por      INTEGER      REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_visitantes_tenant    ON visitantes(tenant_id);
CREATE INDEX idx_visitantes_data_hora ON visitantes(tenant_id, data_hora_entrada DESC);


-- ============================================================
-- 08 - PRESTADORES DE SERVIÇO
-- ============================================================

CREATE TABLE prestadores (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome                VARCHAR(150) NOT NULL,
  empresa             VARCHAR(150),
  documento           VARCHAR(30),
  telefone            VARCHAR(20),
  servico             VARCHAR(200) NOT NULL,
  autorizado_por_id   INTEGER      REFERENCES pessoas(id) ON DELETE SET NULL,
  autorizado_por_nome VARCHAR(150),
  data_hora_entrada   TIMESTAMP    NOT NULL DEFAULT NOW(),
  data_hora_saida     TIMESTAMP,
  observacao          TEXT,
  registrado_por      INTEGER      REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_prestadores_tenant    ON prestadores(tenant_id);
CREATE INDEX idx_prestadores_data_hora ON prestadores(tenant_id, data_hora_entrada DESC);


-- ============================================================
-- 09 - ENCOMENDAS
-- ============================================================

CREATE TABLE encomendas (
  id                 SERIAL PRIMARY KEY,
  tenant_id          INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  destinatario_id    INTEGER      REFERENCES pessoas(id) ON DELETE SET NULL,
  destinatario_nome  VARCHAR(150),
  descricao          VARCHAR(200),
  transportadora     VARCHAR(100),
  data_chegada       TIMESTAMP    NOT NULL DEFAULT NOW(),
  retirada           BOOLEAN      NOT NULL DEFAULT FALSE,
  data_retirada      TIMESTAMP,
  retirado_por       VARCHAR(150),
  observacao         TEXT,
  registrado_por     INTEGER      REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_encomendas_tenant       ON encomendas(tenant_id);
CREATE INDEX idx_encomendas_destinatario ON encomendas(tenant_id, destinatario_id);
CREATE INDEX idx_encomendas_retirada     ON encomendas(tenant_id, retirada);
CREATE INDEX idx_encomendas_data         ON encomendas(tenant_id, data_chegada DESC);

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
```