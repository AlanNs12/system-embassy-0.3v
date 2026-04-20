require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globais
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/admin',   require('./routes/admin'));
// app.use('/api/pessoas',     require('./routes/pessoas'));     // Etapa 7
// app.use('/api/veiculos',    require('./routes/veiculos'));    // Etapa 8
// app.use('/api/visitantes',  require('./routes/visitantes')); // Etapa 9
// app.use('/api/prestadores', require('./routes/prestadores')); // Etapa 10
// app.use('/api/encomendas',  require('./routes/encomendas')); // Etapa 11

// Handler de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
