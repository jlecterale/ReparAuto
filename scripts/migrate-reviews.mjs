#!/usr/bin/env node

/**
 * Migration script for structured reviews (Plan 26).
 *
 * - Backfills the `criterios` field on any review that doesn't have it yet.
 * - Also creates a `uniqueKey` field = `${autorUid}_${anuncioId}` for audits.
 *
 * New reviews are already created with deterministic IDs (autorUid_anuncioId)
 * and criterios. This script updates the legacy docs so they work with the
 * new ReviewFormStructured component.
 *
 * Usage:
 *   node scripts/migrate-reviews.mjs            # write changes
 *   node scripts/migrate-reviews.mjs --dry-run  # report only
 */

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'reparauto-site';
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 400;

if (getApps().length === 0) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}
const db = getFirestore();

/**
 * Returns default criteria for a given anuncioTipo.
 * Mirrors the logic in src/lib/reviewUtils.ts.
 */
function getDefaultCriterios(anuncioTipo, anuncioId) {
  const fixos = {
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

  const base = (fixos[anuncioTipo] || []).map((c) => ({ ...c, nota: 0 }));

  // For workshops, we would need to look up the workshop's especialidades.
  // Since we don't have the especialidades in the review doc itself,
  // we skip extra criteria in this migration — the legacy review just
  // gets the 5 fixed criteria. New reviews created via ReviewFormStructured
  // will have the full extra criteria.

  return base;
}

async function migrateReviews() {
  console.log(`\n=== Migrating reviews (${DRY_RUN ? 'DRY RUN' : 'LIVE'}) ===\n`);

  const snap = await db
    .collection('reviews')
    .select(
      new FieldPath('criterios'),
      new FieldPath('anuncioTipo'),
      new FieldPath('autorUid'),
      new FieldPath('anuncioId'),
      new FieldPath('nota'),
    )
    .get();

  console.log(`Total reviews: ${snap.size}`);

  const needsCriterios = snap.docs.filter((doc) => !doc.get('criterios'));
  console.log(`Missing criterios: ${needsCriterios.length}`);

  if (DRY_RUN) {
    for (const doc of needsCriterios.slice(0, 10)) {
      const data = doc.data();
      console.log(
        `  Would update: ${doc.id} (${data.anuncioTipo || 'unknown'}, nota=${data.nota})`,
      );
    }
    if (needsCriterios.length > 10) {
      console.log(`  ... and ${needsCriterios.length - 10} more`);
    }
    return needsCriterios.length;
  }

  let updated = 0;
  for (let i = 0; i < needsCriterios.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const doc of needsCriterios.slice(i, i + BATCH_SIZE)) {
      const data = doc.data();
      const anuncioTipo = data.anuncioTipo || 'carro';
      const criterios = getDefaultCriterios(anuncioTipo);

      // Compute the average nota from criterios
      const notaCriterios =
        criterios.length > 0
          ? Math.round(
              (criterios.reduce((s, c) => s + c.nota, 0) / criterios.length) *
                10,
            ) / 10
          : data.nota || 0;

      // Keep the existing nota if criterios are all 0
      const finalNota = criterios.every((c) => c.nota === 0)
        ? data.nota || 0
        : notaCriterios;

      batch.update(doc.ref, {
        criterios,
        nota: finalNota,
        uniqueKey: `${data.autorUid || 'unknown'}_${data.anuncioId || 'unknown'}`,
      });
      updated++;
    }
    await batch.commit();
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: updated ${updated}/${needsCriterios.length}`);
  }

  console.log(`\nDone. ${updated} reviews updated.`);
  return updated;
}

migrateReviews()
  .then((count) => {
    if (DRY_RUN) {
      console.log(`\nDry-run complete. ${count} reviews would be updated.`);
    } else {
      console.log(`\nMigration complete. ${count} reviews updated.`);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
