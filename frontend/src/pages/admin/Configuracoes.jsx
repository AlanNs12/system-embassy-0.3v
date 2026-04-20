import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const MODULO_INFO = {
  veiculos:    { label: 'Veículos',             icon: '🚗', desc: 'Controle de entrada e saída de veículos' },
  visitantes:  { label: 'Visitantes',           icon: '🙋', desc: 'Registro de visitantes na portaria' },
  prestadores: { label: 'Prestadores',          icon: '🔧', desc: 'Controle de prestadores de serviço' },
  encomendas:  { label: 'Encomendas',           icon: '📦', desc: 'Recebimento e retirada de encomendas' },
};

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition
        ${checked ? 'bg-blue-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition
        ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function AdminConfiguracoes() {
  const [config, setConfig]     = useState(null);
  const [nome, setNome]         = useState('');
  const [logoUrl, setLogoUrl]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [togglingMod, setTogglingMod] = useState(null);
  const [sucesso, setSucesso]   = useState('');
  const [erro, setErro]         = useState('');

  async function carregar() {
    try {
      const res = await api.get('/admin/configuracoes');
      setConfig(res.data);
      setNome(res.data.nome);
      setLogoUrl(res.data.logo_url || '');
    } catch (err) {
      setErro('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function salvarDados(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');
    try {
      await api.put('/admin/configuracoes', { nome, logo_url: logoUrl });
      setSucesso('Configurações salvas com sucesso!');
      carregar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function toggleModulo(modulo, ativo) {
    setTogglingMod(modulo);
    try {
      await api.patch(`/admin/modulos/${modulo}`, { ativo });
      setConfig(c => ({
        ...c,
        modulos: c.modulos.map(m => m.modulo === modulo ? { ...m, ativo } : m),
      }));
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao alterar módulo.');
    } finally {
      setTogglingMod(null);
    }
  }

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">

        {/* Dados do local */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Dados do Local</h2>
          <form onSubmit={salvarDados} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do local</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                placeholder="Ex: Condomínio Jardins"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL da logo</label>
              <input
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {logoUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={logoUrl}
                    alt="Preview da logo"
                    className="h-12 w-auto rounded-lg border border-gray-200 object-contain bg-gray-50 p-1"
                    onError={e => e.target.style.display = 'none'}
                  />
                  <span className="text-xs text-gray-400">Preview da logo</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Tipo: </span>
              {config?.tipo === 'condominio' ? 'Condomínio' : 'Local Público'} •{' '}
              <span className="font-medium text-gray-700">Plano: </span>
              {config?.plano === 'fixo' ? 'Fixo' : `Por moradores (máx. ${config?.max_moradores || '—'})`} •{' '}
              <span className="font-medium text-gray-700">Vence: </span>
              {config?.data_vencimento
                ? new Date(config.data_vencimento).toLocaleDateString('pt-BR')
                : '—'}
            </div>

            {erro    && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{erro}</div>}
            {sucesso && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">{sucesso}</div>}

            <button type="submit" disabled={salvando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>

        {/* Módulos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-1">Módulos</h2>
          <p className="text-xs text-gray-400 mb-4">Ative ou desative funcionalidades da portaria</p>

          <div className="space-y-3">
            {config?.modulos?.map(({ modulo, ativo }) => {
              const info = MODULO_INFO[modulo];
              return (
                <div key={modulo} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{info.label}</p>
                      <p className="text-xs text-gray-400">{info.desc}</p>
                    </div>
                  </div>
                  <Toggle
                    checked={ativo}
                    onChange={(val) => toggleModulo(modulo, val)}
                    disabled={togglingMod === modulo}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
