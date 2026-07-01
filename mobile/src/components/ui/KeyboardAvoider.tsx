import { KeyboardAvoidingView } from 'react-native';
import type { ReactNode } from 'react';

interface KeyboardAvoiderProps {
  children: ReactNode;
  /**
   * Distance from the top of the screen to the top of this view — normally the
   * navigation header height (`useHeaderHeight()`). Required so the keyboard
   * offset is measured correctly under a header. Defaults to 0 (no header).
   */
  offset?: number;
  className?: string;
}

/**
 * Cross-platform keyboard avoidance.
 *
 * Uses `padding` on both iOS and Android. The previous `behavior={undefined}`
 * on Android did nothing, so with edge-to-edge (Expo SDK 55 default, where the
 * window no longer auto-resizes) the keyboard covered text inputs. `padding`
 * lifts the content above the keyboard on both platforms.
 */
export function KeyboardAvoider({
  children,
  offset = 0,
  className = 'flex-1',
}: KeyboardAvoiderProps) {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={offset}
      className={className}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
