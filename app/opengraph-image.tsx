import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Site-wide default share image (homepage + any route without its own).
// Listing pages override this with the car/part/workshop photo.
export const alt =
  'RecarGarage — o ecossistema automóvel que liga compradores, vendedores de peças, oficinas e mecânicos. Disponível na Web, Android e iOS.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Literal hexes mirror the design tokens in src/index.css — Satori (next/og)
// can't resolve Tailwind classes, so the brand palette is inlined here.
const NAVY_800 = '#0c386b';
const NAVY_950 = '#081d38';
const ORANGE = '#ef7c2c';

// Embed the original brand assets from /public as data URIs (pure-path SVGs,
// so Satori rasterises them cleanly). Fall back to a text wordmark if the files
// can't be read in some environment.
function asset(file: string): string | null {
  try {
    const svg = readFileSync(join(process.cwd(), 'public', file)).toString('base64');
    return `data:image/svg+xml;base64,${svg}`;
  } catch {
    return null;
  }
}
const LOGO_SRC = asset('logo.svg');
const ICON_SRC = asset('pwa-icon.svg');

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: NAVY_950,
          backgroundImage: `linear-gradient(135deg, ${NAVY_800}, ${NAVY_950})`,
          fontFamily: 'sans-serif',
        }}
      >
        {/* App-icon mark */}
        {ICON_SRC ? (
          <img src={ICON_SRC} width={92} height={92} alt="" style={{ borderRadius: 18 }} />
        ) : null}

        {/* Brand wordmark (original logo.svg), with a text fallback */}
        {LOGO_SRC ? (
          <img src={LOGO_SRC} width={440} height={150} alt="" style={{ marginTop: 18 }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 18, fontSize: 110, fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff' }}>
            <span>Recar</span>
            <span style={{ color: ORANGE }}>Garage</span>
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            fontSize: 38,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'center',
            maxWidth: 940,
            lineHeight: 1.3,
          }}
        >
          O ecossistema automóvel que liga compradores, vendedores de peças, oficinas e mecânicos
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 30,
            fontWeight: 700,
            color: ORANGE,
            border: `2px solid ${ORANGE}`,
            borderRadius: 999,
            padding: '12px 36px',
          }}
        >
          Disponível na Web · Android · iOS
        </div>

        <div style={{ marginTop: 20, fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
          recargarage.com
        </div>
      </div>
    ),
    { ...size },
  );
}
