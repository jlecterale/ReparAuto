import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/providers/AppProvider';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth } = useApp();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '';
    return location.pathname.startsWith(path);
  };

  const items = [
    { path: '/', icon: 'fa-solid fa-magnifying-glass', label: 'Pesquisar' },
    { path: '/anunciar', icon: 'fa-solid fa-plus-circle', label: 'Anunciar' },
    { path: '/pecas', icon: 'fa-solid fa-gears', label: 'Peças' },
    ...(auth.isAdmin ? [{ path: '/admin', icon: 'fa-solid fa-shield-halved', label: 'Admin' }] : []),
    { path: '/perfil', icon: 'fa-solid fa-user', label: 'Perfil' },
  ];

  return (
    <nav className="bottom-nav" id="bottomNav">
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={isActive(item.path) ? 'active' : ''}
        >
          <i className={item.icon}></i>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
