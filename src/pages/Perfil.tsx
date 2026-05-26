import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import ProfileLoggedOut from '@/components/perfil/ProfileLoggedOut';
import ProfileLoggedIn from '@/components/perfil/ProfileLoggedIn';
import LoginModal from '@/components/auth/LoginModal';

export default function Perfil() {
  const { auth } = useApp();
  const { isLoggedIn } = auth;

  const [loginModalAberto, setLoginModalAberto] = useState(false);

  return (
    <div className="page-enter">
      {isLoggedIn ? (
        <ProfileLoggedIn />
      ) : (
        <ProfileLoggedOut onLogin={() => setLoginModalAberto(true)} />
      )}

      <LoginModal
        show={loginModalAberto}
        onClose={() => setLoginModalAberto(false)}
      />
    </div>
  );
}
