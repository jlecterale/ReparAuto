import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/providers/AppProvider';
import { createUserProfile } from '@/lib/db';
import { getDistritoForConcelho } from '@/lib/geo';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import { useCodigoPostal } from '@/hooks/useCodigoPostal';
import {
  validarTelefone,
  validarCodigoPostal,
  validarNif,
  formatarCodigoPostal,
} from '@/lib/utils';
import type { TipoConta } from '@/types/usuario';

export default function SetupPerfil() {
  const { auth } = useApp();
  const { user, isLoggedIn, profileCompleted, loading: authLoading, refreshProfile } = auth;
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [distrito, setDistrito] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [morada, setMorada] = useState('');
  const [nif, setNif] = useState('');
  const [tipoConta, setTipoConta] = useState<TipoConta>('particular');
  const [bio, setBio] = useState('');
  const [notificacoes, setNotificacoes] = useState(true);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const lookupTriggered = useRef(false);

  const cpLookup = useCodigoPostal();

  useEffect(() => {
    if (cpLookup.localidade && !lookupTriggered.current) {
      lookupTriggered.current = true;
      setLocalidade(cpLookup.localidade);
      const d = getDistritoForConcelho(cpLookup.localidade);
      if (d) setDistrito(d);
      if (cpLookup.ruas.length > 0) {
        setMorada((prev) => prev || cpLookup.ruas[0]);
      }
    }
  }, [cpLookup.localidade, cpLookup.ruas]);

  useEffect(() => {
    if (cpLookup.erro) {
      setErro(cpLookup.erro);
    }
  }, [cpLookup.erro]);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || profileCompleted)) {
      navigate(profileCompleted ? '/perfil' : '/', { replace: true });
    }
  }, [authLoading, isLoggedIn, profileCompleted, navigate]);

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setTelefone(user.telefone || '');
      setLocalidade(user.localidade || '');
      setDistrito(user.distrito || getDistritoForConcelho(user.localidade || '') || '');
      setCodigoPostal(user.codigoPostal || '');
      setMorada(user.morada || '');
      setNif(user.nif || '');
      setTipoConta(user.tipoConta || 'particular');
      setBio(user.bio || '');
      setNotificacoes(user.notificacoes ?? true);
    }
  }, [user]);

  const handleBlur = (campo: string) => {
    setTouched((prev) => ({ ...prev, [campo]: true }));
  };

  const campoValido = (campo: string): boolean | null => {
    if (!touched[campo]) return null;
    switch (campo) {
      case 'nome': return nome.trim().length > 0;
      case 'telefone': return validarTelefone(telefone);
      case 'localidade': return localidade.trim().length > 0;
      case 'codigoPostal': return !codigoPostal.trim() || validarCodigoPostal(codigoPostal);
      case 'nif': return !nif.trim() || validarNif(nif);
      default: return null;
    }
  };

  const inputClasse = (campo: string, extra = ''): string => {
    const valido = campoValido(campo);
    const base = 'w-full border rounded-xl p-3 text-sm focus:outline-none transition';
    if (valido === false) return `${base} border-red-400 bg-red-50 focus:border-red-500 ${extra}`;
    if (valido === true) return `${base} border-green-400 bg-green-50/50 focus:border-green-500 ${extra}`;
    return `${base} border-gray-300 focus:border-accent ${extra}`;
  };

  const handleSubmit = async () => {
    setErro('');

    if (!nome.trim()) {
      setErro('O nome é obrigatório.');
      return;
    }
    if (!telefone.trim()) {
      setErro('O número de telemóvel é obrigatório.');
      return;
    }
    if (!validarTelefone(telefone)) {
      setErro('Número de telemóvel inválido. Ex: 912345678 ou 253123456');
      return;
    }
    if (!localidade.trim()) {
      setErro('A localidade é obrigatória.');
      return;
    }
    if (codigoPostal.trim() && !validarCodigoPostal(codigoPostal)) {
      setErro('Código postal inválido. Formato: XXXX-XXX');
      return;
    }
    if (nif.trim() && !validarNif(nif)) {
      setErro('NIF inválido. Verifique o número.');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        localidade: localidade.trim(),
        distrito: distrito.trim() || undefined,
        codigoPostal: codigoPostal.trim(),
        morada: morada.trim(),
        nif: nif.trim(),
        tipoConta,
        bio: bio.trim(),
        notificacoes,
        profileCompleted: true,
      };

      await createUserProfile(user!.uid, profileData);
      await refreshProfile();
      navigate('/perfil', { replace: true });
    } catch (err: any) {
      setErro('Erro ao guardar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-accent"></i>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-900">Completar Perfil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Preencha os seus dados para começar a utilizar a plataforma.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Nome Completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Carlos Santos"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onBlur={() => handleBlur('nome')}
              className={inputClasse('nome')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Telemóvel <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              placeholder="Ex: 912345678"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
              onBlur={() => handleBlur('telefone')}
              maxLength={9}
              className={inputClasse('telefone')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Localização <span className="text-red-400">*</span>
            </label>
            <SeletorLocalizacao
              distrito={distrito}
              concelho={localidade}
              onChange={(d, c) => {
                setDistrito(d);
                setLocalidade(c);
                lookupTriggered.current = true;
                handleBlur('localidade');
              }}
              obrigatorio
              erro={touched['localidade'] && !localidade.trim()}
            />
            {cpLookup.localidade && localidade === cpLookup.localidade && !touched['localidade'] && (
              <p className="text-[10px] text-green-600 mt-1">
                <i className="fa-solid fa-check mr-0.5"></i> Preenchido automaticamente pelo código postal
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Código Postal
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="XXXX-XXX"
                  value={codigoPostal}
                  onChange={(e) => {
                    const formatted = formatarCodigoPostal(e.target.value);
                    setCodigoPostal(formatted);
                    lookupTriggered.current = false;
                    if (formatted.length === 8) {
                      cpLookup.buscar(formatted);
                    }
                  }}
                  onBlur={() => {
                    handleBlur('codigoPostal');
                    if (validarCodigoPostal(codigoPostal)) {
                      cpLookup.buscar(codigoPostal);
                    }
                  }}
                  maxLength={8}
                  className={inputClasse('codigoPostal', 'pr-10')}
                />
                {cpLookup.loading && (
                  <i className="fa-solid fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-accent"></i>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                NIF <span className="text-xs text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="123456789"
                value={nif}
                onChange={(e) => setNif(e.target.value.replace(/\D/g, ''))}
                onBlur={() => handleBlur('nif')}
                maxLength={9}
                className={inputClasse('nif')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Morada <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="ruas-list"
                placeholder="Rua, número, bairro..."
                value={morada}
                onChange={(e) => setMorada(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
              />
              <datalist id="ruas-list">
                {cpLookup.ruas.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Tipo de Conta
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTipoConta('particular')}
                className={`flex-1 border-2 rounded-xl p-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  tipoConta === 'particular'
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-gray-200 text-slate-500 hover:border-gray-300'
                }`}
              >
                <i className="fa-solid fa-user"></i> Particular
              </button>
              <button
                type="button"
                onClick={() => setTipoConta('profissional')}
                className={`flex-1 border-2 rounded-xl p-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  tipoConta === 'profissional'
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-gray-200 text-slate-500 hover:border-gray-300'
                }`}
              >
                <i className="fa-solid fa-store"></i> Profissional
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Biografia <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <textarea
              placeholder="Fale um pouco sobre si..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{bio.length}/500</p>
          </div>

          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">Notificações</p>
              <p className="text-xs text-gray-500">Receber atualizações sobre anúncios e mensagens</p>
            </div>
            <button
              type="button"
              onClick={() => setNotificacoes(!notificacoes)}
              className={`w-12 h-6 rounded-full transition relative ${
                notificacoes ? 'bg-accent' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                  notificacoes ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {erro && (
            <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <i className="fa-solid fa-circle-exclamation mr-1"></i> {erro}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`w-full font-bold py-3 rounded-xl transition text-white ${
              saving
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {saving ? (
              <><i className="fa-solid fa-spinner fa-spin mr-2"></i> A guardar...</>
            ) : (
              <><i className="fa-solid fa-check mr-2"></i> Concluir Registo</>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Ao continuar, concorda com os{' '}
            <a href="#/termos" className="text-accent font-semibold hover:underline">Termos de Utilização</a>.
          </p>
        </div>
      </div>
    </div>
  );
}