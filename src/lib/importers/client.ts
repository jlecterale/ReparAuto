'use client';

/**
 * Client helpers for the Standvirtual import API routes: attach the Firebase
 * ID token and translate machine error codes into PT-PT messages. The batch
 * screen drives these serially (concurrency 1) with a delay between calls.
 */

import { auth } from '@/lib/firebase';
import type { CarroFormData } from '@/types/carro';

export interface ImportPreviewData {
  adId: string;
  url: string;
  title: string;
  active: boolean;
  dados: Partial<CarroFormData>;
  fotos: string[];
  unmappedFields: string[];
}

export type ImportPreviewResult =
  | { ok: true; preview: ImportPreviewData }
  | { ok: false; errorCode: string; message: string };

export type ImportAdvertResult =
  | { status: 'created'; carId: string; unmappedFields: string[]; failedPhotoCount: number }
  | { status: 'duplicate'; carId?: string }
  | { status: 'blocked' }
  | { status: 'rate_limited'; retryAfterSeconds: number }
  | { status: 'failed'; reason: string; message: string; fatal?: boolean };

export const IMPORT_ERROR_MESSAGES: Record<string, string> = {
  invalid_url: 'O URL não é um anúncio válido do Standvirtual.',
  not_found: 'Anúncio não encontrado — pode ter sido removido.',
  parse_failed: 'Não foi possível ler o anúncio (formato inesperado).',
  fetch_failed: 'Falha ao contactar o Standvirtual. Tente novamente.',
  blocked: 'O Standvirtual bloqueou temporariamente a leitura automática. Tente mais tarde.',
  rate_limited: 'Limite de importações atingido. Aguarde um pouco e tente novamente.',
  email_not_verified: 'Confirme o seu email antes de importar anúncios.',
  attestation_required: 'Confirme que os anúncios são seus antes de importar.',
  unauthorized: 'Sessão expirada. Inicie sessão novamente.',
  server_unavailable:
    'Servidor sem acesso ao Firebase (em local: configure as credenciais Admin/ADC). Veja o log do servidor.',
  internal: 'Erro inesperado no servidor. Veja o log do servidor para o detalhe.',
  professional_verification_required:
    'Disponível apenas para contas profissionais com documentação validada (Perfil → Verificação).',
  forbidden: 'Sem permissão para importar para outra conta.',
  target_not_found: 'Utilizador de destino não encontrado.',
};

export function importErrorMessage(code: string): string {
  return IMPORT_ERROR_MESSAGES[code] ?? 'Erro inesperado. Tente novamente.';
}

async function authorizedPost(path: string, body: unknown): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('unauthorized');
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export async function previewStandvirtualImport(url: string): Promise<ImportPreviewResult> {
  try {
    const response = await authorizedPost('/api/import/standvirtual/preview', { url });
    const data = (await response.json().catch(() => ({}))) as Partial<ImportPreviewData> & {
      error?: string;
    };
    if (!response.ok || data.error) {
      const code = data.error ?? 'fetch_failed';
      return { ok: false, errorCode: code, message: importErrorMessage(code) };
    }
    return { ok: true, preview: data as ImportPreviewData };
  } catch {
    return { ok: false, errorCode: 'fetch_failed', message: importErrorMessage('fetch_failed') };
  }
}

export type InventoryDiscoveryClientResult =
  | { ok: true; urls: string[]; total: number | null; truncated: boolean }
  | { ok: false; errorCode: string; message: string };

/** Whole-stand discovery — professionals with validated documentation only. */
export async function discoverStandvirtualInventory(
  url: string,
): Promise<InventoryDiscoveryClientResult> {
  try {
    const response = await authorizedPost('/api/import/standvirtual/inventory', { url });
    const data = (await response.json().catch(() => ({}))) as {
      urls?: string[];
      total?: number | null;
      truncated?: boolean;
      error?: string;
    };
    if (!response.ok || data.error || !Array.isArray(data.urls)) {
      const code = data.error ?? 'fetch_failed';
      return { ok: false, errorCode: code, message: importErrorMessage(code) };
    }
    return { ok: true, urls: data.urls, total: data.total ?? null, truncated: data.truncated === true };
  } catch {
    return { ok: false, errorCode: 'fetch_failed', message: importErrorMessage('fetch_failed') };
  }
}

export async function importStandvirtualAdvert(
  url: string,
  opts: { targetUid?: string } = {},
): Promise<ImportAdvertResult> {
  let response: Response;
  try {
    response = await authorizedPost('/api/import/standvirtual/import', {
      url,
      attestOwnership: true,
      ...(opts.targetUid ? { targetUid: opts.targetUid } : {}),
    });
  } catch (err) {
    // Session lost mid-batch: stop the whole run instead of failing every URL.
    if (err instanceof Error && err.message === 'unauthorized') {
      return {
        status: 'failed',
        reason: 'unauthorized',
        message: importErrorMessage('unauthorized'),
        fatal: true,
      };
    }
    return { status: 'failed', reason: 'fetch_failed', message: importErrorMessage('fetch_failed') };
  }

  const data = (await response.json().catch(() => ({}))) as {
    status?: string;
    error?: string;
    carId?: string;
    reason?: string;
    unmappedFields?: string[];
    failedPhotoCount?: number;
  };

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After')) || 60;
    return { status: 'rate_limited', retryAfterSeconds: retryAfter };
  }
  if (!response.ok || data.error) {
    const code = data.error ?? 'fetch_failed';
    // Auth/attestation/target problems affect the whole batch, not just this URL.
    const fatal = [
      'unauthorized',
      'email_not_verified',
      'attestation_required',
      'server_unavailable',
      'forbidden',
      'target_not_found',
    ].includes(code);
    return { status: 'failed', reason: code, message: importErrorMessage(code), fatal };
  }

  if (data.status === 'created' && data.carId) {
    return {
      status: 'created',
      carId: data.carId,
      unmappedFields: data.unmappedFields ?? [],
      failedPhotoCount: data.failedPhotoCount ?? 0,
    };
  }
  if (data.status === 'duplicate') return { status: 'duplicate', carId: data.carId };
  if (data.status === 'blocked') return { status: 'blocked' };
  const reason = data.reason ?? 'fetch_failed';
  return { status: 'failed', reason, message: importErrorMessage(reason) };
}
