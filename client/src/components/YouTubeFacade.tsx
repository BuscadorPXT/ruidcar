import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YouTubeFacadeProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playlist?: string;
  thumbnailQuality?: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault';
}

export default function YouTubeFacade({
  videoId,
  title = 'YouTube Video',
  className,
  autoplay = false,
  muted = true,
  loop = false,
  controls = true,
  playlist,
  thumbnailQuality = 'maxresdefault'
}: YouTubeFacadeProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-load if autoplay is true and intersection observer supports it
  useEffect(() => {
    if (!autoplay || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [autoplay, isLoaded]);

  const handleClick = () => {
    if (!isLoaded) {
      setIsLoaded(true);
    }
  };

  const getThumbnailUrl = () => {
    if (thumbnailError) {
      // Fallback to default quality if maxres fails
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
    return `https://i.ytimg.com/vi/${videoId}/${thumbnailQuality}.jpg`;
  };

  const getEmbedUrl = () => {
    const params = new URLSearchParams({
      autoplay: '1', // Always autoplay when clicked
      mute: muted ? '1' : '0',
      controls: controls ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1'
    });

    if (loop) {
      params.append('loop', '1');
      params.append('playlist', playlist || videoId);
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  if (!isLoaded) {
    return (
      <div
        ref={containerRef}
        className={cn('relative cursor-pointer group overflow-hidden bg-black', className)}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Play video: ${title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Thumbnail */}
        <img
          src={getThumbnailUrl()}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setThumbnailError(true)}
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all duration-200">
          <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>

        {/* YouTube branding (optional) */}
        <div className="absolute top-4 left-4">
          <div className="bg-black/70 px-2 py-1 rounded text-xs text-white">
            YouTube
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <iframe
        src={getEmbedUrl()}
        title={title}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}