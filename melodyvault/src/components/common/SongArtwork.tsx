import React, { useState } from 'react';
import { Disc3, Music2 } from 'lucide-react';

interface SongArtworkProps {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}

export const DEFAULT_ARTWORK_FALLBACK = '/default-artwork.svg';

export const SongArtwork: React.FC<SongArtworkProps> = ({
  src,
  alt,
  className = 'w-10 h-10 rounded-lg',
  iconClassName = 'w-4 h-4 text-purple-400',
}) => {
  const [hasError, setHasError] = useState(false);

  // If no source provided or previous load failed, render the dark-purple vinyl placeholder
  if (!src || hasError) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-[#24173d] via-[#161427] to-[#0d0c16] border border-purple-500/25 flex flex-col items-center justify-center shrink-0 shadow-inner overflow-hidden select-none`}
        title={alt}
        role="img"
        aria-label={alt}
      >
        <Disc3 className={iconClassName} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} object-cover shrink-0`}
      loading="lazy"
    />
  );
};

