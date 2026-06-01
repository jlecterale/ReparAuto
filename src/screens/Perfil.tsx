'use client';

import { useApp } from '@/providers/AppProvider';
import ProfileLoggedOut from '@/components/perfil/ProfileLoggedOut';
import ProfileLoggedIn from '@/components/perfil/ProfileLoggedIn';

export default function Perfil() {
  const { auth, loginModal } = useApp();
  const { isLoggedIn } = auth;

  return (
    <div className="page-enter">
      {isLoggedIn ? (
        <ProfileLoggedIn />
      ) : (
        <ProfileLoggedOut onLogin={() => loginModal.openLoginModal('/perfil')} />
      )}
    </div>
  );
}
