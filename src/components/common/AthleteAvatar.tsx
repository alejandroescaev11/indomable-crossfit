import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AthleteAvatarProps {
  avatar?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AthleteAvatar: React.FC<AthleteAvatarProps> = ({
  avatar,
  name,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : 'A';

  // Si tiene avatar y no ha fallado la carga
  if (avatar && !hasError) {
    return (
      <img
        src={avatar}
        alt={name || 'Atleta'}
        onError={() => setHasError(true)}
        className={`${sizeClasses[size]} rounded-xl object-cover border border-zinc-700/80 shadow-inner ${className}`}
      />
    );
  }

  // Avatar predeterminado estilizado en temática Carbon & Crimson INDOMABLE
  return (
    <div
      className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-red-900/40 flex items-center justify-center font-black font-teko text-red-400 shadow-md relative overflow-hidden select-none shrink-0 ${className}`}
      title={name || 'Atleta'}
    >
      <div className="absolute inset-0 bg-red-600/10 pointer-events-none" />
      <span className="relative z-10 tracking-wider drop-shadow-sm">{initial}</span>
    </div>
  );
};
