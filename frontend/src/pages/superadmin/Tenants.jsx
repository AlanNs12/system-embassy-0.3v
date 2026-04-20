import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MODULOS = ['veiculos', 'visitantes', 'prestadores', 'encomendas'];
const MODULO_LABEL = {
  veiculos: 'Veículos',
  visitantes: 'Visitantes',
  prestadores: 'Prestadores',
  encomendas: 'Encomendas',
};

function Badge({ ativo }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
      ${ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function ModalNovoTenant({ onClose, onSalvo }) {
  const [form, setForm] = useState({
    nome: '', tipo: 'condominio', plano: 'por_moradores', max_moradores: '',
    data_vencimento: '', admin_nome: '', admin_email: '', admin_senha: '',
    modulos: ['veiculos', 'visitantes', 'prestadores', 'encomendas'],
  });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleModulo(m) {
    setForm(f => ({
      ...f,
      modulos: f.modulos.includes(m) ? f.modulos.filter(x => x !== m) : [...f.modulos, m],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post('/tenants', {
        ...form,
        max_moradores: form.max_moradores ? parseInt(form.max_moradores) : null,
      });
      onSalvo();
      onClose();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao criar cliente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Dados do local */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dados do Local</p>
            <div className="space-y-3">
              <input required placeholder="Nome do local *" value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="condominio">Condomínio</option>
                <option value="publico">Local Público (Embaixada / Empresa)</option>
              </select>

              <select value={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="fixo">Plano Fixo</option>
                <option value="por_moradores">Por Quantidade de Moradores</option>
              </select>

              {form.plano === 'por_moradores' && (
                <input type="number" placeholder="Máx. de moradores" value={form.max_moradores}
                  onChange={e => setForm(f => ({ ...f, max_moradores: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vencimento do plano *</label>
                <input required type="date" value={form.data_vencimento}
                  onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Módulos */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Módulos Ativos</p>
            <div className="grid grid-cols-2 gap-2">
              {MODULOS.map(m => (
                <label key={m} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition
                  ${form.modulos.includes(m) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <input type="checkbox" checked={form.modulos.includes(m)}
                    onChange={() => toggleModulo(m)} className="accent-blue-600" />
                  <span className="text-sm">{MODULO_LABEL[m]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Admin do local */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Usuário Administrador</p>
            <div className="space-y-3">
              <input required placeholder="Nome do administrador *" value={form.admin_nome}
                onChange={e => setForm(f => ({ ...f, admin_nome: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input required type="email" placeholder="E-mail do administrador *" value={form.admin_email}
                onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input required type="password" placeholder="Senha inicial *" value={form.admin_senha}
                onChange={e => setForm(f => ({ ...f, admin_senha: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{erro}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 mb-2">
            {loading ? 'Criando...' : 'Criar Cliente'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminTenants() {
  const { logout, user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');

  async function carregar() {
    setLoading(true);
    try {
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function toggleAtivo(tenant) {
    try {
      await api.patch(`/tenants/${tenant.id}/ativo`, { ativo: !tenant.ativo });
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao alterar status.');
    }
  }

  const filtrados = tenants.filter(t =>
    t.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const vencidos = tenants.filter(t => new Date(t.data_vencimento) < new Date()).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
          <p className="text-xs text-gray-500">Gerenciamento de Clientes</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
          Sair
        </button>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-green-600">{tenants.filter(t => t.ativo).length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Ativos</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-red-500">{vencidos}</p>
            <p className="text-xs text-gray-500 mt-0.5">Vencidos</p>
          </div>
        </div>

        {/* Busca + botão novo */}
        <div className="flex gap-2 mb-4">
          <input
            placeholder="Buscar cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap">
            + Novo
          </button>
        </div>

        {/* Lista de tenants */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">Nenhum cliente encontrado</p>
            <p className="text-sm mt-1">Clique em "+ Novo" para cadastrar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(tenant => {
              const vencido = new Date(tenant.data_vencimento) < new Date();
              return (
                <div key={tenant.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">{tenant.nome}</span>
                        <Badge ativo={tenant.ativo} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {tenant.tipo === 'condominio' ? 'Condomínio' : 'Local Público'} •{' '}
                        {tenant.plano === 'fixo' ? 'Plano Fixo' : `Até ${tenant.max_moradores || '—'} moradores`}
                      </p>
                      <p className={`text-xs mt-1 font-medium ${vencido ? 'text-red-500' : 'text-gray-400'}`}>
                        {vencido ? '⚠️ Vencido em ' : 'Vence em '}
                        {new Date(tenant.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleAtivo(tenant)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition
                        ${tenant.ativo
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                      {tenant.ativo ? 'Bloquear' : 'Ativar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ModalNovoTenant onClose={() => setShowModal(false)} onSalvo={carregar} />
      )}
    </div>
  );
}
