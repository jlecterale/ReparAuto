import { render, screen, fireEvent } from '@testing-library/react';
import DetalhesOficina from './DetalhesOficina';
import { getOficinaPorId, deleteOficina, updateOficina } from '@/lib/db';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockAuth = { user: null as any, isAdmin: false };
jest.mock('../providers/AppProvider', () => ({
  useApp: () => ({
    auth: mockAuth,
    loginModal: { openLoginModal: jest.fn() },
  }),
}));

jest.mock('../lib/db', () => ({
  getOficinaPorId: jest.fn(),
  addReview: jest.fn(),
  subscribeReviewsOficina: jest.fn(() => jest.fn()),
  deleteOficina: jest.fn(),
  updateOficina: jest.fn(),
}));

jest.mock('../components/ui/MapViewer', () => () => null);
jest.mock('../components/admin/EditarOficinaModal', () => ({
  __esModule: true,
  default: ({ show, onClose, onSave }: any) => show ? (
    <div data-testid="editar-oficina-modal">
      <button onClick={() => onSave('oficina-1', { nome: 'Oficina Atualizada' })}>Guardar</button>
      <button onClick={onClose}>Fechar</button>
    </div>
  ) : null
}));

function createMockOficina(overrides: any = {}) {
  return {
    id: 'oficina-1',
    criador: 'owner@example.com',
    nome: 'Oficina Rápida',
    descricao: 'Serviço rápido de mecânica.',
    responsavel: 'João Silva',
    telefone: '912345678',
    email: 'contacto@oficinarapida.com',
    distrito: 'Lisboa',
    localidade: 'Lisboa',
    morada: 'Rua Principal, 10',
    especialidades: ['mecanica_convencional'],
    status: 'aprovado',
    dataCriacao: { toDate: () => new Date() },
    ...overrides,
  };
}

afterEach(() => {
  mockAuth.user = null;
  mockAuth.isAdmin = false;
  jest.clearAllMocks();
});

describe('DetalhesOficina', () => {
  it('renders workshop details successfully', async () => {
    const mockOficina = createMockOficina();
    (getOficinaPorId as jest.Mock).mockResolvedValue(mockOficina);

    render(<DetalhesOficina id="oficina-1" />);

    expect(await screen.findByRole('heading', { name: /Oficina Rápida/ })).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Serviço rápido de mecânica.')).toBeInTheDocument();
  });

  it('hides edit and delete buttons for unauthorized users', async () => {
    const mockOficina = createMockOficina();
    (getOficinaPorId as jest.Mock).mockResolvedValue(mockOficina);
    mockAuth.user = { email: 'another@example.com', uid: 'user-2', nome: 'Outro' };
    mockAuth.isAdmin = false;

    render(<DetalhesOficina id="oficina-1" />);

    expect(await screen.findByRole('heading', { name: /Oficina Rápida/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons for the creator', async () => {
    const mockOficina = createMockOficina();
    (getOficinaPorId as jest.Mock).mockResolvedValue(mockOficina);
    mockAuth.user = { email: 'owner@example.com', uid: 'user-1', nome: 'Owner' };
    mockAuth.isAdmin = false;

    render(<DetalhesOficina id="oficina-1" />);

    expect(await screen.findByRole('button', { name: /Editar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Eliminar/ })).toBeInTheDocument();
  });

  it('shows edit and delete buttons for administrators', async () => {
    const mockOficina = createMockOficina();
    (getOficinaPorId as jest.Mock).mockResolvedValue(mockOficina);
    mockAuth.user = { email: 'admin@example.com', uid: 'admin-1', nome: 'Admin' };
    mockAuth.isAdmin = true;

    render(<DetalhesOficina id="oficina-1" />);

    expect(await screen.findByRole('button', { name: /Editar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Eliminar/ })).toBeInTheDocument();
  });

  it('triggers deleteOficina when deleting is confirmed', async () => {
    const mockOficina = createMockOficina();
    (getOficinaPorId as jest.Mock).mockResolvedValue(mockOficina);
    (deleteOficina as jest.Mock).mockResolvedValue(undefined);
    mockAuth.user = { email: 'owner@example.com', uid: 'user-1', nome: 'Owner' };

    render(<DetalhesOficina id="oficina-1" />);

    const deleteBtn = await screen.findByRole('button', { name: /Eliminar/ });
    fireEvent.click(deleteBtn);

    const confirmButtons = screen.getAllByRole('button', { name: /Eliminar/ });
    fireEvent.click(confirmButtons[1]);

    expect(deleteOficina).toHaveBeenCalledWith('oficina-1');
  });

  it('resets workshop status to pendente when updated by a normal creator', async () => {
    const mockOficina = createMockOficina({ status: 'aprovado' });
    (getOficinaPorId as jest.Mock).mockResolvedValue(mockOficina);
    (updateOficina as jest.Mock).mockResolvedValue(undefined);
    mockAuth.user = { email: 'owner@example.com', uid: 'user-1', nome: 'Owner' };
    mockAuth.isAdmin = false;

    render(<DetalhesOficina id="oficina-1" />);

    const editBtn = await screen.findByRole('button', { name: /Editar/ });
    fireEvent.click(editBtn);

    const saveBtn = screen.getByRole('button', { name: /Guardar/ });
    fireEvent.click(saveBtn);

    expect(updateOficina).toHaveBeenCalledWith('oficina-1', {
      nome: 'Oficina Atualizada',
      status: 'pendente',
    });
  });

  it('keeps status when updated by an administrator', async () => {
    const mockOficina = createMockOficina({ status: 'aprovado' });
    (getOficinaPorId as jest.Mock).mockResolvedValue(mockOficina);
    (updateOficina as jest.Mock).mockResolvedValue(undefined);
    mockAuth.user = { email: 'admin@example.com', uid: 'admin-1', nome: 'Admin' };
    mockAuth.isAdmin = true;

    render(<DetalhesOficina id="oficina-1" />);

    const editBtn = await screen.findByRole('button', { name: /Editar/ });
    fireEvent.click(editBtn);

    const saveBtn = screen.getByRole('button', { name: /Guardar/ });
    fireEvent.click(saveBtn);

    expect(updateOficina).toHaveBeenCalledWith('oficina-1', {
      nome: 'Oficina Atualizada',
      status: 'aprovado',
    });
  });
});
