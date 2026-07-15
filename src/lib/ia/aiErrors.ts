/**
 * Maps errors thrown by the AI Cloud Function proxies to safe PT-PT messages.
 * Raw provider/internal errors are never surfaced to the user (§2.5).
 */

const MESSAGES: Record<string, string> = {
  'resource-exhausted':
    'Atingiu o limite semanal de gerações com IA. Tente novamente na próxima semana.',
  unauthenticated: 'Inicie sessão (com email verificado) para usar o assistente de IA.',
  'permission-denied': 'Não tem permissão para usar esta funcionalidade.',
  'failed-precondition':
    'Esta imagem ou conteúdo não pode ser analisado. Tente com outra foto.',
  'invalid-argument': 'Dados do anúncio insuficientes para gerar um resultado.',
  'deadline-exceeded': 'O serviço demorou demasiado a responder. Tente novamente.',
  unavailable: 'O assistente de IA está temporariamente indisponível. Tente novamente.',
};

const FALLBACK = 'Não foi possível concluir o pedido. Tente novamente dentro de momentos.';

export function mapAiErrorToMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  const shortCode = code.replace(/^functions\//, '');
  return MESSAGES[shortCode] ?? FALLBACK;
}
