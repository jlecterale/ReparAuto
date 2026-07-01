// Release signing for Android, fed entirely from .env.
//
// `.env` (gitignored) holds the credentials; the keystore lives outside the repo
// (e.g. ~/keystores/recargarage-upload.jks):
//
//   RG_UPLOAD_STORE_FILE       (path; ~ and $HOME are expanded)
//   RG_UPLOAD_KEY_ALIAS
//   RG_UPLOAD_STORE_PASSWORD
//   RG_UPLOAD_KEY_PASSWORD
//
// `expo prebuild` loads .env into process.env, so this plugin:
//   1. writes those values into the generated android/gradle.properties, and
//   2. injects a release signingConfig into android/app/build.gradle that reads
//      them, switching the release buildType to use it.
//
// The Gradle property is gated, so when the creds are absent (CI / a fresh
// machine without .env) release falls back to the debug keystore and prebuild
// still works. To sign on a new computer you only need the .jks in ~/keystores
// and the passwords in .env — the `android:bundle`/`android:release` scripts
// stay plain `expo prebuild && gradlew`.
const os = require('os');
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const KEYS = [
  'RG_UPLOAD_STORE_FILE',
  'RG_UPLOAD_KEY_ALIAS',
  'RG_UPLOAD_STORE_PASSWORD',
  'RG_UPLOAD_KEY_PASSWORD',
];

function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~')) return os.homedir() + p.slice(1);
  return p.replace(/\$HOME|\$\{HOME\}/g, os.homedir());
}

const RELEASE_SIGNING_BLOCK = `        release {
            if (project.hasProperty('RG_UPLOAD_STORE_FILE')) {
                storeFile file(RG_UPLOAD_STORE_FILE)
                storePassword RG_UPLOAD_STORE_PASSWORD
                keyAlias RG_UPLOAD_KEY_ALIAS
                keyPassword RG_UPLOAD_KEY_PASSWORD
            }
        }
`;

const RELEASE_SIGNING_CONFIG_EXPR =
  "project.hasProperty('RG_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug";

function injectReleaseSigningConfig(contents) {
  let next = contents;
  if (!/signingConfigs\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?RG_UPLOAD_STORE_FILE/.test(next)) {
    const signingConfigsRegex = /signingConfigs\s*\{\s*\n\s*debug\s*\{[\s\S]*?\n\s*\}\s*\n/;
    const match = next.match(signingConfigsRegex);
    if (!match) {
      throw new Error('withAndroidReleaseSigning: signingConfigs.debug block not found');
    }
    next = next.replace(signingConfigsRegex, `${match[0]}${RELEASE_SIGNING_BLOCK}`);
  }
  next = next.replace(
    /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug\b/,
    `$1${RELEASE_SIGNING_CONFIG_EXPR}`,
  );
  return next;
}

module.exports = function withAndroidReleaseSigning(config) {
  // 1. Mirror the .env creds into android/gradle.properties (when present).
  config = withGradleProperties(config, (cfg) => {
    if (!process.env.RG_UPLOAD_STORE_FILE) return cfg; // nothing to sign with
    for (const key of KEYS) {
      const raw = process.env[key];
      if (!raw) continue;
      const value = key === 'RG_UPLOAD_STORE_FILE' ? expandHome(raw) : raw;
      cfg.modResults = cfg.modResults.filter(
        (item) => !(item.type === 'property' && item.key === key),
      );
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });

  // 2. Inject the release signingConfig into build.gradle.
  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = injectReleaseSigningConfig(cfg.modResults.contents);
    return cfg;
  });

  return config;
};
