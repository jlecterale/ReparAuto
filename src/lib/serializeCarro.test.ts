import { serializeCarro, deserializeCarro } from './serializeCarro';
import { buildCarro, timestampLike } from '@/test/factories';

const CREATED_AT_MS = 1719830000000;

describe('serializeCarro / deserializeCarro', () => {
  it('round-trips a listing across the server→client boundary keeping fields and timestamps usable', () => {
    const carro = buildCarro({ dataCriacao: timestampLike(CREATED_AT_MS) });

    const serialized = serializeCarro(carro);
    // The RSC boundary only accepts JSON-safe values — a lossless JSON
    // round-trip proves there are no functions/class instances left.
    const revived = deserializeCarro(JSON.parse(JSON.stringify(serialized)));

    expect(revived.marca).toBe('Renault');
    expect(revived.preco).toBe(1500);
    expect(revived.fotos).toEqual(['https://example.com/foto.jpg']);
    expect(revived.dataCriacao.toMillis()).toBe(CREATED_AT_MS);
    expect(revived.dataCriacao.toDate()).toEqual(new Date(CREATED_AT_MS));
  });

  it('round-trips dataAprovacao so the "Novidade" badge logic keeps working, and leaves it absent when unset', () => {
    const APPROVED_AT_MS = CREATED_AT_MS + 60_000;
    const approved = deserializeCarro(
      JSON.parse(JSON.stringify(serializeCarro(buildCarro({ dataAprovacao: timestampLike(APPROVED_AT_MS) })))),
    );
    expect(approved.dataAprovacao?.toMillis()).toBe(APPROVED_AT_MS);

    const pending = deserializeCarro(JSON.parse(JSON.stringify(serializeCarro(buildCarro()))));
    expect(pending.dataAprovacao).toBeUndefined();
  });

  it('round-trips the import origin fields (plan 24) including the importadoEm timestamp', () => {
    const IMPORTED_AT_MS = CREATED_AT_MS + 120_000;
    const revived = deserializeCarro(
      JSON.parse(
        JSON.stringify(
          serializeCarro(
            buildCarro({
              origem: 'standvirtual',
              origemId: '8Q0B0W',
              origemUrl: 'https://www.standvirtual.com/carros/anuncio/x-ID8Q0B0W.html',
              importadoEm: timestampLike(IMPORTED_AT_MS),
            }),
          ),
        ),
      ),
    );
    expect(revived.origem).toBe('standvirtual');
    expect(revived.origemId).toBe('8Q0B0W');
    expect(revived.importadoEm?.toMillis()).toBe(IMPORTED_AT_MS);

    const manual = deserializeCarro(JSON.parse(JSON.stringify(serializeCarro(buildCarro()))));
    expect(manual.origem).toBeUndefined();
    expect(manual.importadoEm).toBeUndefined();
  });

  it('flattens boost (impulso) timestamps so the serialized form is fully JSON-safe', () => {
    const serialized = serializeCarro(
      buildCarro({
        impulso: {
          ativo: true,
          dataInicio: timestampLike(CREATED_AT_MS),
          dataFim: timestampLike(CREATED_AT_MS + 86_400_000),
        },
      }),
    );

    // A lossless JSON round-trip means nothing (methods, class instances)
    // gets dropped when Next serializes the prop.
    expect(JSON.parse(JSON.stringify(serialized))).toEqual(serialized);
    expect(deserializeCarro(JSON.parse(JSON.stringify(serialized))).impulso?.ativo).toBe(true);
  });
});
