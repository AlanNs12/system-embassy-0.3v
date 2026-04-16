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
