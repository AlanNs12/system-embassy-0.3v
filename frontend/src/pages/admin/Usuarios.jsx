import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function ModalNovoUsuario({ onClose, onSalvo }) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'porteiro' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post('/admin/usuarios', form);
      onSalvo();
      onClose();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao criar usuário.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl">
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <input required placeholder="Nome completo *" value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <input required type="email" placeholder="E-mail *" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <input required type="password" placeholder="Senha inicial *" value={form.senha}
            onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <select value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="porteiro">Porteiro</option>
            <option value="admin">Administrador</option>
          </select>

          {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{erro}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 mb-2">
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </form>
      </div>
    </div>
  );
}

const PERFIL_LABEL = { admin: 'Admin', porteiro: 'Porteiro' };
const PERFIL_COLOR = {
  admin:    'bg-purple-100 text-purple-700',
  porteiro: 'bg-blue-100 text-blue-700',
};

export default function AdminUsuarios() {
  const { user: meUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toggling, setToggling]  = useState(null);

  async function carregar() {
    setLoading(true);
    try {
      const res = await api.get('/admin/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function toggleAtivo(u) {
    setToggling(u.id);
    try {
      await api.patch(`/admin/usuarios/${u.id}/ativo`, { ativo: !u.ativo });
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao alterar usuário.');
    } finally {
      setToggling(null);
    }
  }

  return (
    <AdminLayout>
      <div className="px-4 py-5 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Usuários</h2>
            <p className="text-xs text-gray-400">Porteiros e administradores</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            + Novo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nenhum usuário cadastrado</p>
            <p className="text-sm mt-1">Clique em "+ Novo" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map(u => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-base font-bold text-gray-500">
                      {u.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm truncate">{u.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERFIL_COLOR[u.perfil]}`}>
                        {PERFIL_LABEL[u.perfil]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                </div>

                {/* Não permite desativar a si mesmo */}
                {u.id !== meUser?.id && (
                  <button
                    onClick={() => toggleAtivo(u)}
                    disabled={toggling === u.id}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition
                      ${u.ativo
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'}
                      disabled:opacity-50`}>
                    {toggling === u.id ? '...' : u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <ModalNovoUsuario onClose={() => setShowModal(false)} onSalvo={carregar} />}
    </AdminLayout>
  );
}
