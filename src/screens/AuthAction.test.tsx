import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthAction from './AuthAction';
import CountryProvider from '@/providers/CountryProvider';
import { COUNTRY_STORAGE_KEY } from '@/lib/country';

// The custom Firebase email action handler: /auth/action?mode=...&oobCode=...
// For mode=resetPassword it must enforce the SAME password policy as account
// creation (PASSWORD_RULES: 8 chars, uppercase, number, symbol) — the default
// Firebase-hosted page only enforces 6 characters.

const searchState = { params: new Map<string, string>() };

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => searchState.params.get(key) ?? null,
    toString: () =>
      new URLSearchParams(Object.fromEntries(searchState.params)).toString(),
  }),
}));

const verifyResetCode = jest.fn();
const confirmNewPassword = jest.fn();
jest.mock('../lib/auth', () => ({
  verifyResetCode: (...args: unknown[]) => verifyResetCode(...args),
  confirmNewPassword: (...args: unknown[]) => confirmNewPassword(...args),
}));

function setParams(params: Record<string, string>) {
  searchState.params = new Map(Object.entries(params));
}

beforeEach(() => {
  jest.clearAllMocks();
  verifyResetCode.mockResolvedValue('user@example.com');
  confirmNewPassword.mockResolvedValue(undefined);
});

// AuthAction reads the market via useCountry(); pre-seeding the stored
// preference keeps CountryProvider on its synchronous branch so its
// first-launch GeoIP lookup never fires a real network request from the test.
function renderAuthAction() {
  localStorage.setItem(COUNTRY_STORAGE_KEY, 'PT');
  return render(
    <CountryProvider>
      <AuthAction />
    </CountryProvider>
  );
}

describe('AuthAction — mode=resetPassword', () => {
  beforeEach(() => {
    setParams({ mode: 'resetPassword', oobCode: 'CODE123' });
  });

  it('shows the account email after verifying the code', async () => {
    renderAuthAction();
    expect(await screen.findByText(/user@example\.com/)).toBeInTheDocument();
    expect(verifyResetCode).toHaveBeenCalledWith('CODE123');
  });

  it('shows the same requirements checklist as registration while typing', async () => {
    renderAuthAction();
    const input = await screen.findByLabelText(/nova palavra-passe/i);
    await userEvent.type(input, 'abc');
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Uma letra maiúscula')).toBeInTheDocument();
    expect(screen.getByText('Um número')).toBeInTheDocument();
    expect(screen.getByText('Um símbolo (!@#$...)')).toBeInTheDocument();
  });

  it('keeps submit disabled for a password that fails the policy', async () => {
    renderAuthAction();
    const input = await screen.findByLabelText(/nova palavra-passe/i);
    await userEvent.type(input, 'fraca123'); // no uppercase, no symbol
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
    expect(confirmNewPassword).not.toHaveBeenCalled();
  });

  it('submits a compliant password and shows the success state', async () => {
    renderAuthAction();
    const input = await screen.findByLabelText(/nova palavra-passe/i);
    await userEvent.type(input, 'Forte123!');
    const button = screen.getByRole('button', { name: /guardar/i });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    await waitFor(() =>
      expect(confirmNewPassword).toHaveBeenCalledWith('CODE123', 'Forte123!'),
    );
    expect(await screen.findByText(/palavra-passe alterada/i)).toBeInTheDocument();
  });

  it('shows an expired-link message when the code is invalid', async () => {
    verifyResetCode.mockRejectedValue({ code: 'auth/invalid-action-code' });
    renderAuthAction();
    expect(await screen.findByText(/expirou ou já foi usado/i)).toBeInTheDocument();
  });
});
