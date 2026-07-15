import { getCriteriosPorTipo } from './reviewUtils';
import type { EspecialidadeOficina } from '@/types/oficina';

describe('getCriteriosPorTipo', () => {
  it('returns 5 fixed criteria for cars', () => {
    const result = getCriteriosPorTipo('carro');
    expect(result).toHaveLength(5);
    expect(result.map((c) => c.chave)).toEqual([
      'precisao_anuncio',
      'honestidade_defeitos',
      'documentacao',
      'comunicacao',
      'negociacao',
    ]);
    expect(result[0]).toEqual({
      chave: 'precisao_anuncio',
      rotulo: 'Precisão do anúncio',
      nota: 0,
    });
  });

  it('returns 5 fixed + 0 extra criteria for oficina with no specialties', () => {
    const result = getCriteriosPorTipo('oficina', []);
    expect(result).toHaveLength(5);
    expect(result.map((c) => c.chave)).toEqual([
      'qualidade_servico',
      'pontualidade',
      'preco_justo',
      'comunicacao',
      'limpeza_organizacao',
    ]);
  });

  it('returns 5 fixed + extra criteria matching workshop specialties', () => {
    const especialidades: EspecialidadeOficina[] = [
      'mecanica_convencional',
      'pintura',
    ];
    const result = getCriteriosPorTipo('oficina', especialidades);
    expect(result).toHaveLength(7); // 5 fixed + 2 extra
    expect(result[5].chave).toBe('extra_mecanica_convencional');
    expect(result[5].rotulo).toBe('Qualidade dos reparos mecânicos');
    expect(result[6].chave).toBe('extra_pintura');
    expect(result[6].rotulo).toBe('Qualidade da pintura/funilaria');
  });

  it('returns 4 criteria for parts', () => {
    const result = getCriteriosPorTipo('peca');
    expect(result).toHaveLength(4);
    expect(result.map((c) => c.chave)).toEqual([
      'precisao_estado',
      'velocidade_envio',
      'embalagem',
      'comunicacao',
    ]);
  });

  it('ignores duplicated specialties and only adds each once', () => {
    const especialidades: EspecialidadeOficina[] = [
      'mecanica_convencional',
      'mecanica_convencional',
      'pintura',
    ];
    const result = getCriteriosPorTipo('oficina', especialidades);
    expect(result).toHaveLength(7);
    const extraKeys = result
      .filter((c) => c.chave.startsWith('extra_'))
      .map((c) => c.chave);
    expect(extraKeys).toEqual([
      'extra_mecanica_convencional',
      'extra_pintura',
    ]);
  });

  it('maps every EspecialidadeOficina to an extra criteria', () => {
    const allSpecialties: EspecialidadeOficina[] = [
      'mecanica_convencional',
      'preparacao',
      'pintura',
      'eletrica',
      'eletronica',
      'estetica_automotiva',
      'pneus',
      'ar_condicionado',
      'classicos_restauro',
      'outro',
    ];
    const result = getCriteriosPorTipo('oficina', allSpecialties);
    expect(result).toHaveLength(15); // 5 fixed + 10 extra
    // Every extra has chave starting with extra_ and a non-empty rotulo
    for (const c of result) {
      if (c.chave.startsWith('extra_')) {
        expect(c.rotulo).toBeTruthy();
      }
    }
  });

  it('returns all criteria with nota defaulting to 0', () => {
    const result = getCriteriosPorTipo('carro');
    for (const c of result) {
      expect(c.nota).toBe(0);
    }
  });
});
