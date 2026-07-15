import { render, screen, fireEvent, within } from '@testing-library/react';
import UserTable from './UserTable';
import type { Usuario } from '@/types/usuario';

// These modals pull in the listing/import stack; the table never opens them here.
jest.mock('./GrantPlanModal', () => ({ __esModule: true, default: () => null }));
jest.mock('./ImportInventoryModal', () => ({ __esModule: true, default: () => null }));

const baseUser = (overrides: Partial<Usuario> = {}): Usuario => ({
  uid: 'u1',
  nome: 'Ana Silva',
  email: 'ana@example.com',
  telefone: '',
  localidade: '',
  codigoPostal: '',
  morada: '',
  nif: '',
  tipoConta: 'particular',
  role: 'user',
  bio: '',
  notificacoes: true,
  foto: null,
  profileCompleted: true,
  ...overrides,
});

function renderTable(users: Usuario[], extra: Partial<React.ComponentProps<typeof UserTable>> = {}) {
  const handlers = {
    onRoleChange: jest.fn().mockResolvedValue(undefined),
    onGrantPlan: jest.fn().mockResolvedValue(undefined),
    onRevokePlan: jest.fn().mockResolvedValue(undefined),
    onUpdateUserProfile: jest.fn().mockResolvedValue(undefined),
    onBanUser: jest.fn().mockResolvedValue(undefined),
    onDeleteUser: jest.fn().mockResolvedValue(undefined),
  };
  render(
    <UserTable
      users={users}
      adminUid="admin-self"
      adminNome="Admin"
      {...handlers}
      {...extra}
    />,
  );
  return handlers;
}

describe('UserTable — ban / unban', () => {
  it('bans a normal account through the confirmation modal, forwarding the reason', () => {
    const h = renderTable([baseUser()]);

    fireEvent.click(screen.getByRole('button', { name: 'Banir conta' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText(/Motivo/i), { target: { value: 'spam repetido' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    expect(h.onBanUser).toHaveBeenCalledWith('u1', true, 'spam repetido');
  });

  it('shows a Banido badge and a Desbanir action for a banned account', () => {
    const h = renderTable([baseUser({ banned: true })]);

    expect(screen.getByText('Banido')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Desbanir conta' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    expect(h.onBanUser).toHaveBeenCalledWith('u1', false, undefined);
  });
});

describe('UserTable — delete', () => {
  it('deletes an account through the confirmation modal', () => {
    const h = renderTable([baseUser()]);

    fireEvent.click(screen.getByRole('button', { name: 'Apagar conta' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    expect(h.onDeleteUser).toHaveBeenCalledWith('u1');
  });
});

describe('UserTable — safety guards', () => {
  it('never exposes ban/delete for admin accounts', () => {
    renderTable([baseUser({ uid: 'other-admin', role: 'admin' })]);

    expect(screen.queryByRole('button', { name: 'Banir conta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apagar conta' })).not.toBeInTheDocument();
  });

  it('never exposes ban/delete for the signed-in admin themselves', () => {
    renderTable([baseUser({ uid: 'admin-self' })]);

    expect(screen.queryByRole('button', { name: 'Banir conta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apagar conta' })).not.toBeInTheDocument();
  });
});
