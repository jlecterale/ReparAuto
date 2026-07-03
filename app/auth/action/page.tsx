import { Suspense } from 'react';
import type { Metadata } from 'next';
import AuthAction from '@/screens/AuthAction';

// Custom Firebase email action handler (set as the templates' action URL in
// the Firebase console). Handles mode=resetPassword with the app's password
// policy; every other mode is forwarded to the default hosted handler.
export const metadata: Metadata = {
  title: 'Definir nova palavra-passe',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuthAction />
    </Suspense>
  );
}
