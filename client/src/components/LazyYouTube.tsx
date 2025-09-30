import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

interface LazyYouTubeProps {
  videoId: string;
  title: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playlist?: string;
}

export default function LazyYouTube({
  videoId,
  title,
  className = '',
  autoplay = false,
  muted = true,
  loop = false,
  controls = false,
  playlist
}: LazyYouTubeProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [shouldAutoload, setShouldAutoload] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // First observer: detect when component is near viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Increased margin for preloading thumbnail
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Second observer: for autoplay, only load when mostly visible
  useEffect(() => {
    if (!autoplay || !isInView || isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldAutoload(true);
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '0px',
        threshold: 0.5 // Load only when 50% visible for autoplay
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoplay, isInView, isLoaded]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const generateYouTubeUrl = () => {
    const params = new URLSearchParams();

    if (autoplay) params.append('autoplay', '1');
    if (muted) params.append('mute', '1');
    if (loop) params.append('loop', '1');
    if (!controls) params.append('controls', '0');
    if (playlist) params.append('playlist', playlist);

    params.append('showinfo', '0');
    params.append('rel', '0');
    params.append('playsinline', '1');
    params.append('enablejsapi', '1');
    params.append('modestbranding', '1');

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {!isInView ? (
        // Placeholder até o vídeo entrar na viewport
        <div className="w-full h-full bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Carregando vídeo...</p>
          </div>
        </div>
      ) : !isLoaded ? (
        // Thumbnail com botão de play
        <div
          className="relative w-full h-full cursor-pointer group"
          onClick={handleLoad}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLoad();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Carregar vídeo: ${title}`}
        >
          <img
            src={thumbnailUrl}
            alt={`Thumbnail do vídeo: ${title}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-colors">
            <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 transition-colors">
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-sm font-medium">{title}</p>
          </div>
        </div>
      ) : (
        // YouTube iframe
        <iframe
          width="100%"
          height="100%"
          src={generateYouTubeUrl()}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="w-full h-full"
        />
      )}
    </div>
  );
}