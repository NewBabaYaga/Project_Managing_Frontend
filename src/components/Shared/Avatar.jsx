import { useState, useEffect } from 'react';
import { API_BASE } from '../../api/axiosInstance';

const COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500',
  'bg-teal-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500',
];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}


export default function Avatar({ name = '', avatarUrl = null, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [avatarUrl]);

  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';

  if (avatarUrl && !imgError) {
    const fullUrl = avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE}${avatarUrl}`;
    return (
      <img
        src={fullUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} ${colorFor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}>
      {initials || '?'}
    </div>
  );
}
