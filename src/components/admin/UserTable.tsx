'use client';

import { useState } from 'react';
import type { Usuario, Role } from '@/types/usuario';
import { formatarData } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckCircle, Storefront } from '@phosphor-icons/react';

interface UserTableProps {
  users: Usuario[];
  onRoleChange: (uid: string, role: Role) => Promise<void>;
  onUpdateUserProfile: (uid: string, updates: Partial<Usuario>) => Promise<void>;
}

export default function UserTable({ users, onRoleChange, onUpdateUserProfile }: UserTableProps) {
  const [confirm, setConfirm] = useState<{ uid: string; nome: string; role: Role } | null>(null);
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  const handleRoleChange = async (uid: string, role: Role) => {
    setLoadingUid(uid);
    try {
      await onRoleChange(uid, role);
    } finally {
      setLoadingUid(null);
      setConfirm(null);
    }
  };

  const handleToggleVerified = async (u: Usuario) => {
    setLoadingUid(u.uid);
    try {
      const newVerified = !u.verificado;
      await onUpdateUserProfile(u.uid, { verificado: newVerified });
    } finally {
      setLoadingUid(null);
    }
  };

  const handleToggleProfessional = async (u: Usuario) => {
    setLoadingUid(u.uid);
    try {
      const newTipoConta = u.tipoConta === 'profissional' ? 'particular' : 'profissional';
      const existingBadges = (u.badges || []).filter((b) => b !== 'profissional');
      const newBadges = newTipoConta === 'profissional' ? [...existingBadges, 'profissional'] : existingBadges;
      await onUpdateUserProfile(u.uid, {
        tipoConta: newTipoConta,
        badges: newBadges,
      });
    } finally {
      setLoadingUid(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-fg-subtle uppercase tracking-wider border-b border-slate-200">
              <th className="pb-3 pr-4">UID</th>
              <th className="pb-3 pr-4">Nome</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Role</th>
              <th className="pb-3 pr-4">Estatuto</th>
              <th className="pb-3 pr-4">Data de Registo</th>
              <th className="pb-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="py-3 pr-4 font-mono text-xs text-fg-subtle max-w-[100px] truncate">{u.uid}</td>
                <td className="py-3 pr-4 font-medium text-fg-heading">{u.nome || '—'}</td>
                <td className="py-3 pr-4 text-fg-muted">{u.email}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-fg-muted'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1">
                    {u.verificado && (
                      <Badge cor="blue">
                        <CheckCircle size={12} weight="fill" /> Verificado
                      </Badge>
                    )}
                    {u.tipoConta === 'profissional' && (
                      <Badge cor="brand">
                        <Storefront size={12} weight="fill" /> Profissional
                      </Badge>
                    )}
                    {!u.verificado && u.tipoConta !== 'profissional' && (
                      <Badge cor="gray">Normal</Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-fg-subtle text-xs">
                  {u.dataCriacao ? formatarData(u.dataCriacao) : '—'}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={u.role}
                      disabled={loadingUid === u.uid}
                      onChange={(e) => {
                        const newRole = e.target.value as Role;
                        if (newRole !== u.role) {
                          setConfirm({ uid: u.uid, nome: u.nome || u.email, role: newRole });
                        }
                      }}
                      className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent cursor-pointer"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>

                    <button
                      disabled={loadingUid === u.uid}
                      onClick={() => handleToggleVerified(u)}
                      className={`p-1.5 rounded-lg border transition ${
                        u.verificado
                          ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                          : 'border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-500'
                      }`}
                      title={u.verificado ? 'Remover Verificação' : 'Marcar como Verificado'}
                    >
                      <CheckCircle size={16} weight={u.verificado ? 'fill' : 'regular'} />
                    </button>

                    <button
                      disabled={loadingUid === u.uid}
                      onClick={() => handleToggleProfessional(u)}
                      className={`p-1.5 rounded-lg border transition ${
                        u.tipoConta === 'profissional'
                          ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
                          : 'border-slate-200 text-slate-400 hover:border-brand-200 hover:text-brand-500'
                      }`}
                      title={u.tipoConta === 'profissional' ? 'Tornar Particular' : 'Marcar como Profissional'}
                    >
                      <Storefront size={16} weight={u.tipoConta === 'profissional' ? 'fill' : 'regular'} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-fg-subtle text-sm">
                  Nenhum utilizador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-fg-heading mb-2">Confirmar alteração</h3>
            <p className="text-sm text-fg-muted mb-4">
              Pretende alterar o role de <strong>{confirm.nome}</strong> para <strong>{confirm.role}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                tipo="secundario"
                onClick={() => setConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                tipo="primario"
                onClick={() => handleRoleChange(confirm.uid, confirm.role)}
                disabled={loadingUid === confirm.uid}
                carregando={loadingUid === confirm.uid}
              >
                {loadingUid === confirm.uid ? 'A alterar...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
