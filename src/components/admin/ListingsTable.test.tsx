import { render, screen, fireEvent } from '@testing-library/react';
import ListingsTable from './ListingsTable';
import { buildCarro, buildPeca } from '@/test/factories';

// The edit modals pull in the whole listing form stack (Firebase, maps, …);
// the table itself never opens them in these tests.
jest.mock('./EditarCarroModal', () => ({ __esModule: true, default: () => null }));
jest.mock('./EditarPecaModal', () => ({ __esModule: true, default: () => null }));

const noopHandlers = {
  onDeleteCarro: jest.fn(),
  onDeletePeca: jest.fn(),
  onApproveCarro: jest.fn(),
  onRejectCarro: jest.fn(),
  onApprovePeca: jest.fn(),
  onRejectPeca: jest.fn(),
  onUpdateCarro: jest.fn(),
  onUpdatePeca: jest.fn(),
  onBulkAction: jest.fn(),
};

const carroPt = buildCarro({ id: 'car-pt', marca: 'Renault', modelo: 'Clio', local: 'Braga' });
const carroBr = buildCarro({ id: 'car-br', marca: 'Fiat', modelo: 'Uno', local: 'São Paulo', country: 'BR' });
const pecaBr = buildPeca({ id: 'peca-br', titulo: 'Farol Uno', country: 'BR' });

function renderTable(overrides: Partial<React.ComponentProps<typeof ListingsTable>> = {}) {
  return render(
    <ListingsTable
      carros={[carroPt, carroBr]}
      pecas={[pecaBr]}
      {...noopHandlers}
      {...overrides}
    />,
  );
}

describe('ListingsTable — country filter', () => {
  it('shows listings from both markets by default', () => {
    renderTable();

    expect(screen.getByText(/Renault Clio/)).toBeInTheDocument();
    expect(screen.getByText(/Fiat Uno/)).toBeInTheDocument();
  });

  it('keeps only the selected market and restores on "Todos"', () => {
    renderTable();

    fireEvent.click(screen.getByRole('button', { name: /Brasil/ }));
    expect(screen.queryByText(/Renault Clio/)).not.toBeInTheDocument();
    expect(screen.getByText(/Fiat Uno/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Portugal/ }));
    expect(screen.getByText(/Renault Clio/)).toBeInTheDocument();
    expect(screen.queryByText(/Fiat Uno/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Todos/ }));
    expect(screen.getByText(/Renault Clio/)).toBeInTheDocument();
    expect(screen.getByText(/Fiat Uno/)).toBeInTheDocument();
  });

  it('also filters the parts tab by market', () => {
    renderTable();

    fireEvent.click(screen.getByRole('button', { name: /Peças/ }));
    fireEvent.click(screen.getByRole('button', { name: /Portugal/ }));
    expect(screen.queryByText('Farol Uno')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Brasil/ }));
    expect(screen.getByText('Farol Uno')).toBeInTheDocument();
  });
});

describe('ListingsTable — listing details and open link', () => {
  it('shows the listing location', () => {
    renderTable();

    expect(screen.getByText(/Braga/)).toBeInTheDocument();
    expect(screen.getByText(/São Paulo/)).toBeInTheDocument();
  });

  it('links each car to its public page in a new tab', () => {
    renderTable();

    const link = screen.getByRole('link', { name: /Abrir anúncio Renault Clio/ });
    expect(link).toHaveAttribute('href', '/detalhes/car-pt');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('links each part to its public page in a new tab', () => {
    renderTable();

    fireEvent.click(screen.getByRole('button', { name: /Peças/ }));
    const link = screen.getByRole('link', { name: /Abrir anúncio Farol Uno/ });
    expect(link).toHaveAttribute('href', '/pecas/peca-br');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
