const PALAVRAS_PROIBIDAS = [
  'caralho', 'foda', 'fodase', 'foda-se', 'puta', 'puta que pariu', 'pqp',
  'merda', 'bosta', 'cusao', 'viado', 'putaria', 'porra',
  'arrombado', 'arrombada', 'babaca', 'boceta', 'buceta', 'cacete',
  'corno', 'cornudo', 'desgraca', 'filho da puta', 'fdp',
  'piranha', 'puto', 'rapariga',
  'vagabundo', 'vagabunda', 'vai tomar no cu', 'vtnc', 'vai se foder',
  'otario', 'idiota', 'imbecil',
  'retardado', 'retardada', 'pau no cu', 'pnc',
  'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'asshole', 'bastard',
  'motherfucker', 'damn', 'dick', 'cunt', 'whore', 'slut',
  'piss', 'wanker',
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[0@]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[4]/g, 'a');
}

const PALAVRAS_NORMALIZADAS = PALAVRAS_PROIBIDAS.map(normalizar);

export function contemProfanity(texto: string): boolean {
  const normalizado = normalizar(texto);
  return PALAVRAS_NORMALIZADAS.some((palavra) => normalizado.includes(palavra));
}
