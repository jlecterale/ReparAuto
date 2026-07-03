import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaveAlertButton from './SaveAlertButton';
import useAlertSubscriptions from '@/hooks/useAlertSubscriptions';

jest.mock('@/hooks/useAlertSubscriptions', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@/lib/db', () => ({
  __esModule: true,
  ALERT_INVALID_ERROR: 'alert/invalid',
  ALERT_LIMIT_ERROR: 'alert/limit-reached',
}));
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => mockToast,
}));

const mockToast = { sucesso: jest.fn(), erro: jest.fn(), info: jest.fn() };
const mockUseAlertSubscriptions = useAlertSubscriptions as jest.Mock;
const criar = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAlertSubscriptions.mockReturnValue({
    alertas: [],
    loading: false,
    criar,
    atualizar: jest.fn(),
    remover: jest.fn(),
    limite: 10,
    atLimit: false,
  });
});

const carrosFilters = { marca: 'BMW' };

describe('SaveAlertButton', () => {
  it('is disabled with a hint when there is no active filter', () => {
    render(<SaveAlertButton uid="u1" filters={{}} />);
    expect(screen.getByRole('button', { name: /criar alerta/i })).toBeDisabled();
    expect(screen.getByText(/defina pelo menos um filtro/i)).toBeInTheDocument();
  });

  it('requires login instead of creating when there is no uid', async () => {
    const onRequireLogin = jest.fn();
    render(<SaveAlertButton uid={undefined} filters={carrosFilters} onRequireLogin={onRequireLogin} />);
    await userEvent.click(screen.getByRole('button', { name: /criar alerta/i }));
    expect(onRequireLogin).toHaveBeenCalled();
    expect(criar).not.toHaveBeenCalled();
  });

  it('creates the alert, toasts success, and disables itself as "Alerta criado"', async () => {
    criar.mockResolvedValue({});
    render(<SaveAlertButton uid="u1" filters={carrosFilters} />);
    await userEvent.click(screen.getByRole('button', { name: /criar alerta/i }));

    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'filtro_salvo', filters: expect.objectContaining({ marca: 'BMW' }) }),
    );
    expect(mockToast.sucesso).toHaveBeenCalledWith('Alerta criado!');
    expect(screen.getByRole('button', { name: /alerta criado/i })).toBeDisabled();
  });

  it('re-enables once the filters change after a successful create', async () => {
    criar.mockResolvedValue({});
    const { rerender } = render(<SaveAlertButton uid="u1" filters={carrosFilters} />);
    await userEvent.click(screen.getByRole('button', { name: /criar alerta/i }));
    expect(screen.getByRole('button', { name: /alerta criado/i })).toBeDisabled();

    rerender(<SaveAlertButton uid="u1" filters={{ marca: 'Audi' }} />);
    expect(screen.getByRole('button', { name: /^criar alerta$/i })).not.toBeDisabled();
  });

  it('shows the limit message and stays disabled when atLimit is true', () => {
    mockUseAlertSubscriptions.mockReturnValue({
      alertas: [],
      loading: false,
      criar,
      atualizar: jest.fn(),
      remover: jest.fn(),
      limite: 10,
      atLimit: true,
    });
    render(<SaveAlertButton uid="u1" filters={carrosFilters} />);
    expect(screen.getByRole('button', { name: /criar alerta/i })).toBeDisabled();
    expect(screen.getByText(/limite de 10 alertas atingido/i)).toBeInTheDocument();
  });

  it('toasts the limit error and keeps the button re-clickable on failure', async () => {
    criar.mockRejectedValue(new Error('alert/limit-reached'));
    render(<SaveAlertButton uid="u1" filters={carrosFilters} />);
    await userEvent.click(screen.getByRole('button', { name: /criar alerta/i }));

    expect(mockToast.erro).toHaveBeenCalledWith(expect.stringContaining('limite'));
    expect(screen.getByRole('button', { name: /^criar alerta$/i })).not.toBeDisabled();
  });
});
