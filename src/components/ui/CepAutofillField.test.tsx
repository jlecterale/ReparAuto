import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CepAutofillField from './CepAutofillField';

// The field is a BR-only helper: typing a complete CEP looks the address up on
// BrasilAPI (mocked at the fetch boundary, like useCepBr.test.ts) and hands the
// result to the host form via onFound — the form owns where each piece lands.
let mockCountry: 'PT' | 'BR' = 'BR';

jest.mock('../../providers/CountryProvider', () => ({
  useCountry: () => ({
    country: mockCountry,
    setCountry: jest.fn(),
    locked: false,
    setLocked: jest.fn(),
  }),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function cepResponse(body: Record<string, unknown>, ok = true) {
  return { ok, status: ok ? 200 : 404, json: async () => body };
}

const paulistaResponse = {
  state: 'SP',
  city: 'São Paulo',
  neighborhood: 'Bela Vista',
  street: 'Avenida Paulista',
};

const cepInput = () => screen.getByLabelText(/CEP/i);

beforeEach(() => {
  fetchMock.mockReset();
  mockCountry = 'BR';
});

describe('CepAutofillField', () => {
  it('não renderiza nada fora do mercado brasileiro', () => {
    mockCountry = 'PT';
    const { container } = render(<CepAutofillField city="" onFound={jest.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('formata o CEP digitado com hífen', () => {
    render(<CepAutofillField city="" onFound={jest.fn()} />);

    // Incomplete on purpose: formatting must not wait for the lookup.
    fireEvent.change(cepInput(), { target: { value: '013101' } });

    expect(cepInput()).toHaveValue('01310-1');
  });

  it('busca o endereço ao completar o CEP e entrega-o via onFound uma única vez', async () => {
    fetchMock.mockResolvedValue(cepResponse(paulistaResponse));
    const onFound = jest.fn();
    render(<CepAutofillField city="" onFound={onFound} />);

    fireEvent.change(cepInput(), { target: { value: '01310100' } });

    await waitFor(() =>
      expect(onFound).toHaveBeenCalledWith({
        state: 'São Paulo',
        city: 'São Paulo',
        neighborhood: 'Bela Vista',
        street: 'Avenida Paulista',
      }),
    );
    expect(onFound).toHaveBeenCalledTimes(1);
  });

  it('não busca enquanto o CEP está incompleto', () => {
    render(<CepAutofillField city="" onFound={jest.fn()} />);

    fireEvent.change(cepInput(), { target: { value: '01310' } });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mostra o erro do lookup e não chama onFound quando o CEP não existe', async () => {
    fetchMock.mockResolvedValue(cepResponse({}, false));
    const onFound = jest.fn();
    render(<CepAutofillField city="" onFound={onFound} />);

    fireEvent.change(cepInput(), { target: { value: '99999999' } });

    expect(
      await screen.findByText('CEP não encontrado. Preencha manualmente.'),
    ).toBeInTheDocument();
    expect(onFound).not.toHaveBeenCalled();
  });

  it('confirma o preenchimento automático enquanto a cidade do formulário for a do CEP', async () => {
    fetchMock.mockResolvedValue(cepResponse(paulistaResponse));
    const { rerender } = render(<CepAutofillField city="" onFound={jest.fn()} />);

    fireEvent.change(cepInput(), { target: { value: '01310100' } });
    // The host form applies the address and feeds the city back as a prop.
    rerender(<CepAutofillField city="São Paulo" onFound={jest.fn()} />);

    expect(
      await screen.findByText(/Preenchido automaticamente/i),
    ).toBeInTheDocument();

    // The note must not linger after the user picks a different city.
    rerender(<CepAutofillField city="Campinas" onFound={jest.fn()} />);
    expect(screen.queryByText(/Preenchido automaticamente/i)).not.toBeInTheDocument();
  });
});
