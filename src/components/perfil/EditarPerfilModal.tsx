'use client';

import { Check, CircleNotch, Lock, Storefront, User, WarningCircle } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import { getDistritoForConcelho } from '@/lib/geo';
import { useCodigoPostal } from '@/hooks/useCodigoPostal';
import { useCepBr } from '@/hooks/useCepBr';
import { useCountry } from '@/providers/CountryProvider';
import { term } from '@/lib/terms';
import {
  validarTelefone,
  validarCodigoPostal,
  validarNif,
  formatarCodigoPostal,
} from '@/lib/utils';

interface EditarPerfilModalProps {
  show: boolean;
  onClose: () => void;
}

export default function EditarPerfilModal({ show, onClose }: EditarPerfilModalProps) {
  const { auth } = useApp();
  const { user, updateProfile, refreshProfile } = auth;
  const toast = useToast();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [distrito, setDistrito] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [morada, setMorada] = useState('');
  const [nif, setNif] = useState('');
  const [bio, setBio] = useState('');
  const [notificacoes, setNotificacoes] = useState(true);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const lookupTriggered = useRef(false);

  // Both lookups run; pick by market. PT derives the district from the city;
  // BR gets the state directly from the CEP (BrasilAPI).
  const { country } = useCountry();
  const cpLookupPt = useCodigoPostal();
  const cpLookupBr = useCepBr();
  const cpLookup = country === 'BR' ? cpLookupBr : cpLookupPt;

  useEffect(() => {
    if (cpLookup.localidade && !lookupTriggered.current) {
      lookupTriggered.current = true;
      setLocalidade(cpLookup.localidade);
      const d = cpLookup.distrito || getDistritoForConcelho(cpLookup.localidade, 'PT');
      if (d) setDistrito(d);
      if (cpLookup.ruas.length > 0) {
        setMorada((prev) => prev || cpLookup.ruas[0]);
      }
    }
  }, [cpLookup.localidade, cpLookup.distrito, cpLookup.ruas]);

  useEffect(() => {
    if (cpLookup.erro) {
      setErro(cpLookup.erro);
    }
  }, [cpLookup.erro]);

  const handleBlur = (campo: string) => {
    setTouched((prev) => ({ ...prev, [campo]: true }));
  };

  const campoValido = (campo: string): boolean | null => {
    if (!touched[campo]) return null;
    switch (campo) {
      case 'nome': return nome.trim().length > 0;
      case 'telefone': return !telefone.trim() || validarTelefone(telefone, country);
      case 'codigoPostal': return !codigoPostal.trim() || validarCodigoPostal(codigoPostal, country);
      case 'nif': return !nif.trim() || validarNif(nif, country);
      default: return null;
    }
  };

  const inputClasse = (campo: string, extra?: string): string => {
    const valido = campoValido(campo);
    const base = 'w-full border rounded-xl p-3 text-sm focus:outline-none transition';
    const extraClasse = extra ? ` ${extra}` : '';
    if (valido === false) return `${base}${extraClasse} border-red-400 bg-red-50 focus:border-red-500`;
    if (valido === true) return `${base}${extraClasse} border-green-400 bg-green-50/50 focus:border-green-500`;
    return `${base}${extraClasse} border-gray-300 focus:border-accent`;
  };

  useEffect(() => {
    if (user && show) {
      setNome(user.nome || '');
      setTelefone(user.telefone || '');
      setLocalidade(user.localidade || '');
      setDistrito(user.distrito || getDistritoForConcelho(user.localidade || '') || '');
      setCodigoPostal(user.codigoPostal || '');
      setMorada(user.morada || '');
      setNif(user.nif || '');
      setBio(user.bio || '');
      setNotificacoes(user.notificacoes ?? true);
      setErro('');
      setTouched({});
      lookupTriggered.current = false;
    }
  }, [user, show]);

  const handleSave = async () => {
    setErro('');

    if (!nome.trim()) {
      setErro('O nome é obrigatório.');
      return;
    }
    if (telefone.trim() && !validarTelefone(telefone, country)) {
      setErro(term('phoneInvalid', country));
      return;
    }
    if (codigoPostal.trim() && !validarCodigoPostal(codigoPostal, country)) {
      setErro(term('postalCodeInvalid', country));
      return;
    }
    if (nif.trim() && !validarNif(nif, country)) {
      setErro(term('taxIdInvalid', country));
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        nome: nome.trim(),
        telefone: telefone.trim(),
        localidade: localidade.trim(),
        distrito: distrito.trim() || undefined,
        codigoPostal: codigoPostal.trim(),
        morada: morada.trim(),
        nif: nif.trim(),
        bio: bio.trim(),
        notificacoes,
      });
      await refreshProfile();
      toast?.sucesso('Perfil atualizado com sucesso!');
      onClose();
    } catch {
      setErro('Erro ao guardar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo="Editar Perfil" tamanho="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-fg-subtle mb-1">Nome Completo</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => handleBlur('nome')}
            className={inputClasse('nome')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-subtle mb-1">{term('phoneLabel', country)}</label>
          <input
            type="tel"
            placeholder={term('phonePlaceholder', country)}
            value={telefone}
            onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
            onBlur={() => handleBlur('telefone')}
            maxLength={country === 'BR' ? 11 : 9}
            className={inputClasse('telefone')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-subtle mb-1">Localização</label>
          <SeletorLocalizacao
            distrito={distrito}
            concelho={localidade}
            onChange={(d, c) => {
              setDistrito(d);
              setLocalidade(c);
              lookupTriggered.current = true;
            }}
          />
          {cpLookup.localidade && localidade === cpLookup.localidade && !touched['localidade'] && (
            <p className="text-[10px] text-green-600 mt-1">
              <Check className="mr-0.5" /> Preenchido automaticamente pelo {term('postalCodeLabel', country)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-1">{term('postalCodeLabel', country)}</label>
            <div className="relative">
              <input
                type="text"
                placeholder={term('postalCodePlaceholder', country)}
                value={codigoPostal}
                onChange={(e) => {
                  const formatted = formatarCodigoPostal(e.target.value, country);
                  setCodigoPostal(formatted);
                  lookupTriggered.current = false;
                  // Auto-fill address once the code is complete (BR CEP = 9 chars, PT = 8).
                  if (formatted.length === (country === 'BR' ? 9 : 8)) {
                    cpLookup.buscar(formatted);
                  }
                }}
                onBlur={() => {
                  handleBlur('codigoPostal');
                  if (validarCodigoPostal(codigoPostal, country)) {
                    cpLookup.buscar(codigoPostal);
                  }
                }}
                maxLength={country === 'BR' ? 9 : 8}
                className={inputClasse('codigoPostal', 'pr-10')}
              />
              {cpLookup.loading && (
                <CircleNotch className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-accent" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-1">{term('taxIdLabel', country)}</label>
            <input
              type="text"
              placeholder={term('taxIdPlaceholder', country)}
              value={nif}
              onChange={(e) => setNif(e.target.value.replace(/\D/g, ''))}
              onBlur={() => handleBlur('nif')}
              maxLength={country === 'BR' ? 14 : 9}
              className={inputClasse('nif')}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-subtle mb-1">{term('addressLabel', country)}</label>
          <div className="relative">
            <input
              type="text"
              list="modal-ruas-list"
              value={morada}
              onChange={(e) => setMorada(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
            />
            <datalist id="modal-ruas-list">
              {cpLookup.ruas.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-subtle mb-2">Tipo de Conta</label>
          <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl p-3 bg-slate-100 text-fg-muted cursor-not-allowed">
            {user?.tipoConta === 'profissional' ? <Storefront weight="fill" /> : <User weight="fill" />}
            <span className="text-sm font-bold">
              {user?.tipoConta === 'profissional' ? 'Profissional' : 'Particular'}
            </span>
            <Lock className="ml-auto text-fg-subtle" />
          </div>
          <p className="text-[11px] text-fg-subtle mt-1">
            O tipo de conta é definido no registo e não pode ser alterado.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-subtle mb-1">Biografia</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-accent resize-none"
          />
          <p className="text-xs text-fg-subtle text-right">{bio.length}/500</p>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
          <div>
            <p className="text-sm font-semibold text-fg-heading">Notificações</p>
            <p className="text-xs text-fg-subtle">Receber atualizações sobre anúncios</p>
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
          <Alert tipo="erro" icone={<WarningCircle />} className="!p-3 !rounded-lg !items-center font-semibold">
            {erro}
          </Alert>
        )}

        <Button
          tipo="primario"
          tamanho="lg"
          blocoCompleto
          icone={<Check />}
          onClick={handleSave}
          disabled={saving}
          carregando={saving}
        >
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>
    </Modal>
  );
}