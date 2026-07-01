const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Installs the repo's shared debug keystore (credentials/debug.keystore) into
// android/app/debug.keystore on every prebuild. This way every machine and CI
// signs debug builds with the SAME key, so a single SHA-1 needs to be
// registered in Firebase for Google Sign-In (otherwise Expo generates a new
// per-machine keystore → DEVELOPER_ERROR). A debug keystore is not a secret.
module.exports = function withDebugKeystore(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, 'credentials', 'debug.keystore');
      const dest = path.join(cfg.modRequest.platformProjectRoot, 'app', 'debug.keystore');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
      return cfg;
    },
  ]);
};
