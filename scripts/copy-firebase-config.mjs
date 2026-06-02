// Copies native Firebase config files from `firebase/` into the native
// platform folders before a Capacitor build. Keeps the source of truth in one
// place (`firebase/`) and avoids the app crashing on boot due to a missing
// GoogleService-Info.plist / google-services.json.
//
// Run automatically via `npm run cap:sync` (and the `debug:*` scripts).
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  {
    platform: 'iOS',
    src: join(root, 'firebase', 'GoogleService-Info.plist'),
    dest: join(root, 'ios', 'App', 'App', 'GoogleService-Info.plist'),
    // Only relevant once the ios platform has been added.
    requiresDir: join(root, 'ios', 'App', 'App'),
  },
  {
    platform: 'Android',
    src: join(root, 'firebase', 'google-services.json'),
    dest: join(root, 'android', 'app', 'google-services.json'),
    requiresDir: join(root, 'android', 'app'),
  },
];

for (const { platform, src, dest, requiresDir } of targets) {
  if (!existsSync(requiresDir)) continue; // platform not added yet — skip silently
  if (!existsSync(src)) {
    console.warn(
      `[firebase] ⚠️  ${platform}: ${src.replace(root + '/', '')} não encontrado. ` +
        `O app nativo vai crashar no boot até você adicionar esse arquivo (veja firebase/README.md).`,
    );
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`[firebase] ✅ ${platform}: copiado para ${dest.replace(root + '/', '')}`);
}
