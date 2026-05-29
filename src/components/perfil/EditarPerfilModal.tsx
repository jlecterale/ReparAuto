'use client';

import { Check, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import { getDistritoForConcelho } from '@/lib/geo';
import { useCodigoPostal } from '@/hooks/useCodigoPostal';
import {
  validarTelefone,
  validarCodigoPostal,
  validarNif,
  formatarCodigoPostal,
} from '@/lib/utils';
import type { TipoConta } from '@/types/usuario';

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

  const handleBlur = (campo: string) => {
    setTouched((prev) => ({ ...prev, [campo]: true }));
  };

  const campoValido = (campo: string): boolean | null => {
    if (!touched[campo]) return null;
    switch (campo) {
      case 'nome': return nome.trim().length > 0;
      case 'telefone': return !telefone.trim() || validarTelefone(telefone);
      case 'codigoPostal': return !codigoPostal.trim() || validarCodigoPostal(codigoPostal);
      case 'nif': return !nif.trim() || validarNif(nif);
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
      setTipoConta(user.tipoConta || 'particular');
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
    if (telefone.trim() && !validarTelefone(telefone)) {
      setErro('Número de telemóvel inválido. Ex: 912345678 ou 253123456');
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
      await updateProfile({
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
          <label className="block text-xs font-semibold text-fg-subtle mb-1">Telemóvel</label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
            onBlur={() => handleBlur('telefone')}
            maxLength={9}
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
              <Check className="mr-0.5" /> Preenchido automaticamente pelo código postal
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-1">Código Postal</label>
            <div className="relative">
              <input
                type="text"
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
            <label className="block text-xs font-semibold text-fg-subtle mb-1">NIF</label>
            <input
              type="text"
              value={nif}
              onChange={(e) => setNif(e.target.value.replace(/\D/g, ''))}
              onBlur={() => handleBlur('nif')}
              maxLength={9}
              className={inputClasse('nif')}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-subtle mb-1">Morada</label>
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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTipoConta('particular')}
              className={`flex-1 border-2 rounded-xl p-3 text-sm font-bold transition ${
                tipoConta === 'particular'
                  ? 'border-accent bg-accent/5 text-accent'
                  : 'border-gray-200 text-fg-subtle'
              }`}
            >
              Particular
            </button>
            <button
              type="button"
              onClick={() => setTipoConta('profissional')}
              className={`flex-1 border-2 rounded-xl p-3 text-sm font-bold transition ${
                tipoConta === 'profissional'
                  ? 'border-accent bg-accent/5 text-accent'
                  : 'border-gray-200 text-fg-subtle'
              }`}
            >
              Profissional
            </button>
          </div>
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