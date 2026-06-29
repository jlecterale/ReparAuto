'use client';

import { Check, CircleNotch, Storefront, User, UserPlus, WarningCircle } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { createUserProfile } from '@/lib/db';
import { getDistritoForConcelho } from '@/lib/geo';
import { getPendingIntent } from '@/lib/onboarding';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import Alert from '@/components/ui/Alert';
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
  const router = useRouter();

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
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace('/app');
      return;
    }
    // Profile complete: leave setup. When the visitor picked an onboarding
    // intent, AppProvider resumes it; otherwise head to the profile.
    if (profileCompleted && !getPendingIntent()) {
      router.replace('/perfil');
    }
  }, [authLoading, isLoggedIn, profileCompleted, router]);

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
    const base =
      'w-full border rounded-xl px-3.5 py-3 text-sm text-fg-strong placeholder:text-fg-subtle ' +
      'focus:outline-none focus:ring-3 focus:ring-accent/25 transition';
    if (valido === false) return `${base} border-danger-500 bg-danger-50 focus:border-danger-500 ${extra}`;
    if (valido === true) return `${base} border-success-500 bg-success-50/60 focus:border-success-600 ${extra}`;
    return `${base} border-neutral-300 focus:border-accent ${extra}`;
  };

  const labelCls = 'block text-xs font-bold text-fg mb-1.5';
  const opcional = <span className="font-normal text-fg-subtle">(opcional)</span>;

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

      const target = getPendingIntent();
      await createUserProfile(user!.uid, profileData);
      await refreshProfile();
      // Navigate deterministically so a transient refreshProfile failure can't
      // strand the user here: head to the chosen creation flow if one is pending
      // (AppProvider's resume effect clears it), otherwise to the profile.
      router.replace(target ?? '/perfil');
    } catch (err: any) {
      setErro('Erro ao guardar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircleNotch className="animate-spin text-3xl text-accent" />
      </div>
    );
  }

  return (
    <div className="page-enter max-w-4xl mx-auto px-1 py-2">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-md">
          <UserPlus size={30} weight="bold" />
        </div>
        <h1 className="text-2xl font-extrabold text-fg-heading">Completar Perfil</h1>
        <p className="text-sm text-fg-muted mt-1">
          Preencha os seus dados para começar a utilizar a plataforma.
        </p>
      </div>

      <div className="space-y-8">
        {/* ---- Dados pessoais ---- */}
        <section className="space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-subtle pb-2 border-b border-neutral-200">
            Dados pessoais
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Nome Completo <span className="text-danger-500">*</span>
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
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full border border-neutral-200 rounded-xl px-3.5 py-3 text-sm bg-neutral-100 text-fg-subtle cursor-not-allowed"
              />
              <p className="text-xs text-fg-subtle mt-1.5">O email não pode ser alterado.</p>
            </div>

            <div>
              <label className={labelCls}>
                Telemóvel <span className="text-danger-500">*</span>
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
          </div>
        </section>

        {/* ---- Localização ---- */}
        <section className="space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-subtle pb-2 border-b border-neutral-200">
            Localização
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Distrito e Concelho <span className="text-danger-500">*</span>
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
                <p className="text-xs font-medium text-success-700 mt-1.5 flex items-center gap-1">
                  <Check weight="bold" /> Preenchido automaticamente pelo código postal
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>Código Postal</label>
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
                  <CircleNotch className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-accent" />
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>NIF {opcional}</label>
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

            <div className="sm:col-span-2">
              <label className={labelCls}>Morada {opcional}</label>
              <input
                type="text"
                list="ruas-list"
                placeholder="Rua, número, bairro..."
                value={morada}
                onChange={(e) => setMorada(e.target.value)}
                className={inputClasse('morada')}
              />
              <datalist id="ruas-list">
                {cpLookup.ruas.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>
        </section>

        {/* ---- Conta ---- */}
        <section className="space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-subtle pb-2 border-b border-neutral-200">
            Conta
          </h2>

          <div>
            <label className={labelCls}>Tipo de Conta</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTipoConta('particular')}
                aria-pressed={tipoConta === 'particular'}
                className={`flex-1 border-2 rounded-xl p-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  tipoConta === 'particular'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-neutral-200 text-fg-muted hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <User weight={tipoConta === 'particular' ? 'fill' : 'regular'} /> Particular
              </button>
              <button
                type="button"
                onClick={() => setTipoConta('profissional')}
                aria-pressed={tipoConta === 'profissional'}
                className={`flex-1 border-2 rounded-xl p-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  tipoConta === 'profissional'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-neutral-200 text-fg-muted hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <Storefront weight={tipoConta === 'profissional' ? 'fill' : 'regular'} /> Profissional
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Biografia {opcional}</label>
            <textarea
              placeholder="Fale um pouco sobre si..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full border border-neutral-300 rounded-xl px-3.5 py-3 text-sm text-fg-strong placeholder:text-fg-subtle focus:outline-none focus:ring-3 focus:ring-accent/25 focus:border-accent resize-none transition"
            />
            <p className="text-xs text-fg-subtle text-right mt-1">{bio.length}/500</p>
          </div>

          <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-3.5">
            <div>
              <p className="text-sm font-bold text-fg-heading">Notificações</p>
              <p className="text-xs text-fg-muted">Receber atualizações sobre anúncios e mensagens</p>
            </div>
            <button
              type="button"
              onClick={() => setNotificacoes(!notificacoes)}
              role="switch"
              aria-checked={notificacoes}
              aria-label="Notificações"
              className={`w-12 h-6 rounded-full transition relative flex-shrink-0 ${
                notificacoes ? 'bg-accent' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                  notificacoes ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {erro && (
          <Alert tipo="erro" icone={<WarningCircle />} className="!p-3 !rounded-lg !items-center font-semibold">
            {erro}
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            tipo="primario"
            tamanho="lg"
            blocoCompleto
            icone={<Check weight="bold" />}
            onClick={handleSubmit}
            disabled={saving}
            carregando={saving}
          >
            {saving ? 'A guardar...' : 'Concluir Registo'}
          </Button>

          <p className="text-xs text-fg-subtle text-center">
            Ao continuar, concorda com os{' '}
            <Link href="/termos" className="text-accent font-bold hover:underline">Termos de Utilização</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}