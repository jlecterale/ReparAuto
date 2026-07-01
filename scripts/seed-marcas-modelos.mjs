#!/usr/bin/env node

/**
 * Seeds the `marcas_modelos` Firestore collection from the static JSON file.
 *
 * Classifies each brand into vehicle types (carro / moto / caminhao) using
 * a curated list. Mixed brands (e.g. BMW, Honda, Mercedes-Benz) get multiple
 * types so the app can filter by type.
 *
 * Usage:
 *   node scripts/seed-marcas-modelos.mjs             # seed Firestore
 *   node scripts/seed-marcas-modelos.mjs --dry-run   # preview only
 */

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'reparauto-site';
const DRY_RUN = process.argv.includes('--dry-run');

// ── Known motorcycle-only brands ──────────────────────────────────────────
const MOTO_BRANDS = new Set([
  'AJP', 'Adiva', 'Aeon', 'Aprilia', 'Aspess Power', 'Axy', 'Azel',
  'Bajaj', 'Benelli', 'Beta', 'Bimota', 'Borile', 'Boss Hoss', 'Buell',
  'Bultaco', 'CCM', 'CF Moto', 'CH Racing', 'CMC', 'CPI', 'CR&S',
  'Cagiva', 'Dado Motors', 'Daelim', 'Derbi', 'Ducati',
  'E-Tropolis', 'E-max', 'Ecomission',
  'Fantic Motor', 'Garelli', 'Gas Gas', 'Generic', 'Ghezzi-Brian',
  'GiMotori', 'GiPuma', 'Gilera', 'Green Mobility Italia',
  'HDM', 'HM', 'HP Power', 'Harley-Davidson', 'Headbanger',
  'Honda Dall\'Ara', 'Hupper', 'Husaberg', 'Husqvarna', 'Hyosung',
  'Indian', 'Italjet', 'Jawa', 'KRC', 'KTM', 'Kawasaki', 'Kawasaki KL',
  'Keeway', 'Kreidler', 'Kymco',
  'LML', 'Lambretta', 'Laverda', 'Leonart', 'Lingben', 'Linhai',
  'MBK', 'MV Agusta', 'MZ', 'Magni', 'Maico', 'Malaguti', 'Mash',
  'Millepercento', 'Mondial', 'Montesa', 'Moto Bellini', 'Moto Guzzi',
  'Moto Morini', 'Moto Rumi', 'MotoBi', 'Motom', 'Motor Union',
  'Nipponia', 'Norton', 'Nox', 'Ossa', 'Over',
  'PGO', 'Paton', 'Peda Motor', 'Piaggio', 'Polini',
  'Quadro', 'Quantya', 'RedMoto Honda', 'Rieju', 'Royal Enfield',
  'SWM', 'Sachs', 'Scorpa', 'Sherco', 'Siamoto', 'Steed',
  'Suzuki Valenti', 'Sym',
  'TGB', 'TM Racing', 'Terra Modena', 'Triumph',
  'Ural', 'Vectrix', 'Vertemati', 'Victory', 'Vor',
  'WT Motors', 'Yamaha',
]);

// ── Known truck / commercial vehicle brands ───────────────────────────────
const TRUCK_BRANDS = new Set([
  'DAF', 'Iveco', 'MAN', 'Ram', 'Scania',
]);

// ── Mixed brands (car + moto) ─────────────────────────────────────────────
const CAR_AND_MOTO_BRANDS = new Set([
  'BMW', 'Honda', 'Mercedes-Benz', 'Peugeot', 'Suzuki', 'Volvo',
]);

// ── Mixed brands (car + truck) ────────────────────────────────────────────
const CAR_AND_TRUCK_BRANDS = new Set([
  'Ford', 'Mercedes-Benz', 'Nissan', 'Renault', 'Toyota', 'Volkswagen',
  'Volvo', 'Mitsubishi', 'Isuzu', 'Chevrolet', 'Dodge',
]);

// ── Mixed brands (car + moto + truck) ─────────────────────────────────────
const ALL_THREE_BRANDS = new Set([
  'BMW', 'Honda', 'Mercedes-Benz',
]);

function classificar(marca) {
  if (ALL_THREE_BRANDS.has(marca)) return ['carro', 'moto', 'caminhao'];
  if (CAR_AND_MOTO_BRANDS.has(marca)) return ['carro', 'moto'];
  if (CAR_AND_TRUCK_BRANDS.has(marca)) return ['carro', 'caminhao'];
  if (MOTO_BRANDS.has(marca)) return ['moto'];
  if (TRUCK_BRANDS.has(marca)) return ['caminhao'];
  // Default: carro
  return ['carro'];
}

async function main() {
  if (getApps().length === 0) {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
  const db = getFirestore();

  // Read the static JSON
  const jsonPath = resolve(__dirname, '..', 'src', 'data', 'marcas-modelos.json');
  const raw = readFileSync(jsonPath, 'utf-8');
  const marcas = JSON.parse(raw);

  console.log(`📦 Lidas ${marcas.length} marcas do JSON estático.\n`);

  const batch = db.batch();
  let count = 0;

  for (const entry of marcas) {
    const tipos = classificar(entry.marca);
    const docRef = db.collection('marcas_modelos').doc(entry.marca);

    const data = {
      nome: entry.marca,
      tipos,
      modelos: entry.modelos,
      ativo: true,
    };

    if (DRY_RUN) {
      console.log(`  ${entry.marca.padEnd(22)} → ${tipos.join(', ').padEnd(18)} (${entry.modelos.length} modelos)`);
    } else {
      batch.set(docRef, data);
      count++;
    }
  }

  if (DRY_RUN) {
    console.log(`\n🔍 Dry-run: ${marcas.length} marcas seriam inseridas.`);
    return;
  }

  // Commit in batches of 500 (Firestore limit)
  const batches = [];
  let currentBatch = db.batch();
  let opCount = 0;

  for (const entry of marcas) {
    const tipos = classificar(entry.marca);
    const docRef = db.collection('marcas_modelos').doc(entry.marca);
    currentBatch.set(docRef, { nome: entry.marca, tipos, modelos: entry.modelos, ativo: true });
    opCount++;

    if (opCount >= 500) {
      batches.push(currentBatch.commit());
      currentBatch = db.batch();
      opCount = 0;
    }
  }
  if (opCount > 0) batches.push(currentBatch.commit());

  await Promise.all(batches);

  console.log(`✅ ${marcas.length} marcas inseridas na coleção "marcas_modelos".`);
  console.log('   Classificação:');
  const stats = { carro: 0, moto: 0, caminhao: 0 };
  for (const entry of marcas) {
    const tipos = classificar(entry.marca);
    for (const t of tipos) stats[t]++;
  }
  console.log(`   🚗 Carro: ${stats.carro}`);
  console.log(`   🏍️  Moto: ${stats.moto}`);
  console.log(`   🚚 Caminhão: ${stats.caminhao}`);
}

main().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
