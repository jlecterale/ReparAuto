import { User } from '@phosphor-icons/react';
import type { Usuario } from '@/types/usuario';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-lime-500',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface UserAvatarProps {
  user: Pick<Usuario, 'nome' | 'foto'> | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-20 h-20 text-3xl',
};

export default function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const nome = user?.nome || 'U';
  const cor = getColor(nome);

  if (user?.foto) {
    return (
      <div className={`${sizeClasses[size]} rounded-full flex-shrink-0 overflow-hidden ${className}`}>
        <img src={user.foto} alt={nome} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${cor} rounded-full flex items-center justify-center text-white flex-shrink-0 ${className}`}
    >
      <User />
    </div>
  );
}
