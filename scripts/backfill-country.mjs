#!/usr/bin/env node

// Plan 20 (Brazil expansion): backfills `country: 'PT'` on every pre-Brazil
// document that has no country yet, across the collections the market filter
// reads. The app treats a missing country as PT, so this backfill is not
// required for correctness — it exists so a future server-side
// `where('country', '==', ...)` query (the scale-up path) can be enabled
// without losing the legacy Portuguese docs.
//
// Usage:
//   node scripts/backfill-country.mjs            # write country: 'PT' where missing
//   node scripts/backfill-country.mjs --dry-run  # report what would be updated

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'reparauto-site';
const DRY_RUN = process.argv.includes('--dry-run');
const DEFAULT_COUNTRY = 'PT';
const BATCH_SIZE = 400; // Firestore batch limit is 500 writes

const COLLECTIONS = [
  'cars',
  'parts',
  'services',
  'users',
  'intencoes_compra',
  'propostas',
];

if (getApps().length === 0) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}
const db = getFirestore();

async function backfillCollection(name) {
  const snap = await db.collection(name).select(new FieldPath('country')).get();
  const missing = snap.docs.filter((doc) => doc.get('country') === undefined);
  console.log(`${name}: ${snap.size} docs, ${missing.length} without country`);
  if (DRY_RUN || missing.length === 0) return missing.length;

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const doc of missing.slice(i, i + BATCH_SIZE)) {
      batch.update(doc.ref, { country: DEFAULT_COUNTRY });
    }
    await batch.commit();
    console.log(`  ${name}: updated ${Math.min(i + BATCH_SIZE, missing.length)}/${missing.length}`);
  }
  return missing.length;
}

let total = 0;
for (const name of COLLECTIONS) {
  total += await backfillCollection(name);
}
console.log(`${DRY_RUN ? '[dry-run] would update' : 'updated'} ${total} docs with country: '${DEFAULT_COUNTRY}'`);
