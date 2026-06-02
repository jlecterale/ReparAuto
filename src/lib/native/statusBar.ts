import { isNativePlatform } from '@/lib/native/platform';

/**
 * Configures the native status bar (no-op on web).
 *
 * The mobile top bar uses the dark `brand-900` background, so the status bar
 * icons/text need to be light to stay legible. We dynamically import the plugin
 * so it is never bundled into the web build or evaluated during SSR/export.
 */
export async function initNativeStatusBar(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    // `Style.Dark` = light icons/text for dark backgrounds.
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // best-effort — plugin may be unavailable
  }
}
