import type { ReviewCriterio } from '@/types/review';
import type { EspecialidadeOficina } from '@/types/oficina';

/**
 * Fixed criteria for each anuncioTipo.
 */
const CRITERIOS_FIXOS: Record<string, Omit<ReviewCriterio, 'nota'>[]> = {
  carro: [
    { chave: 'precisao_anuncio', rotulo: 'Precisão do anúncio' },
    { chave: 'honestidade_defeitos', rotulo: 'Honestidade sobre defeitos' },
    { chave: 'documentacao', rotulo: 'Documentação' },
    { chave: 'comunicacao', rotulo: 'Comunicação' },
    { chave: 'negociacao', rotulo: 'Negociação' },
  ],
  peca: [
    { chave: 'precisao_estado', rotulo: 'Precisão do estado da peça' },
    { chave: 'velocidade_envio', rotulo: 'Velocidade de envio' },
    { chave: 'embalagem', rotulo: 'Embalagem e proteção' },
    { chave: 'comunicacao', rotulo: 'Comunicação' },
  ],
  oficina: [
    { chave: 'qualidade_servico', rotulo: 'Qualidade do serviço prestado' },
    { chave: 'pontualidade', rotulo: 'Pontualidade e cumprimento de prazos' },
    { chave: 'preco_justo', rotulo: 'Preço justo / relação custo-benefício' },
    { chave: 'comunicacao', rotulo: 'Comunicação e transparência' },
    { chave: 'limpeza_organizacao', rotulo: 'Limpeza e organização' },
  ],
};

/**
 * Maps each EspecialidadeOficina to an extra review criterion for workshops.
 */
const CRITERIO_ESPECIALIDADE: Record<EspecialidadeOficina, string> = {
  mecanica_convencional: 'Qualidade dos reparos mecânicos',
  preparacao: 'Qualidade da preparação/tuning',
  pintura: 'Qualidade da pintura/funilaria',
  eletrica: 'Qualidade dos serviços elétricos',
  eletronica: 'Qualidade do diagnóstico eletrônico',
  estetica_automotiva: 'Qualidade do detailing/estética',
  pneus: 'Qualidade dos serviços de pneus',
  ar_condicionado: 'Qualidade do serviço de ar condicionado',
  classicos_restauro: 'Qualidade do restauro de clássicos',
  outro: 'Qualidade geral do serviço',
};

/**
 * Returns the array of review criteria appropriate for a given listing type.
 *
 * - `carro`: 5 fixed criteria
 * - `peca`: 4 fixed criteria
 * - `oficina`: 5 fixed criteria + 1 extra per `especialidades`
 *
 * Every criterion starts with `nota = 0` (unrated).
 */
export function getCriteriosPorTipo(
  anuncioTipo: 'carro' | 'peca' | 'oficina',
  especialidades?: EspecialidadeOficina[],
): ReviewCriterio[] {
  const fixos = CRITERIOS_FIXOS[anuncioTipo] ?? [];
  const criterios: ReviewCriterio[] = fixos.map((c) => ({ ...c, nota: 0 }));

  if (anuncioTipo === 'oficina' && especialidades) {
    const seen = new Set<string>();
    for (const esp of especialidades) {
      if (seen.has(esp)) continue;
      seen.add(esp);
      const rotulo = CRITERIO_ESPECIALIDADE[esp];
      if (rotulo) {
        criterios.push({
          chave: `extra_${esp}`,
          rotulo,
          nota: 0,
        });
      }
    }
  }

  return criterios;
}

/**
 * Computes the arithmetic mean of all criteria ratings, rounded to 1 decimal.
 * Returns 0 if the array is empty or all ratings are 0.
 */
export function calcularMediaCriterios(criterios: ReviewCriterio[]): number {
  if (!criterios || criterios.length === 0) return 0;
  const sum = criterios.reduce((acc, c) => acc + c.nota, 0);
  return Math.round((sum / criterios.length) * 10) / 10;
}
