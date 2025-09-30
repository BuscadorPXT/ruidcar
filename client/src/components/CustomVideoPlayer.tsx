import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';

// Interface para a API do YouTube
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface CustomVideoPlayerProps {
  videoId: string;
  thumbnailUrl?: string;
  title?: string;
  onClose?: () => void;
}

export function CustomVideoPlayer({ 
  videoId, 
  thumbnailUrl, 
  title,
  onClose
}: CustomVideoPlayerProps) {
  // Verificar se é um vídeo do formato Shorts
  const isShorts = videoId === "nmJUZj85qAE"; // ID do vídeo shorts do Juninho
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);
  
  // Função para limpar os elementos do YouTube
  const cleanYouTubePlayer = () => {
    try {
      // Tenta encontrar o iframe
      const iframe = document.querySelector('iframe[src*="youtube"]');
      if (!iframe) return;
      
      // Acessa o documento dentro do iframe
      const iframeDocument = (iframe as HTMLIFrameElement).contentDocument || 
                            ((iframe as HTMLIFrameElement).contentWindow?.document);
      
      if (!iframeDocument) return;
      
      // Aplica estilo diretamente no documento do iframe
      const style = iframeDocument.createElement('style');
      style.textContent = `
        .ytp-chrome-top,
        .ytp-chrome-bottom,
        .ytp-watermark,
        .ytp-youtube-button,
        .ytp-title,
        .ytp-share-button,
        .ytp-watch-later-button,
        .ytp-impression-link,
        .ytp-pause-overlay,
        .ytp-endscreen-content {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `;
      
      iframeDocument.head.appendChild(style);
    } catch (error) {
      console.error('Erro ao tentar limpar o player do YouTube:', error);
    }
  };
  
  // Carregar a API do YouTube
  useEffect(() => {
    // Se a API já estiver carregada
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }
    
    // Adicionar o script da API do YouTube
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    
    // Callback quando a API estiver pronta
    window.onYouTubeIframeAPIReady = initPlayer;
    
    return () => {
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);
  
  // Inicializar o player
  const initPlayer = () => {
    if (!playerElementRef.current) return;
    
    // Configurações específicas para vídeos do formato Shorts
    const playerConfig = {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        controls: 0,
        disablekb: 0,
        fs: 0,
        iv_load_policy: 3,
        loop: 0,
        playlist: videoId,
        color: 'white',
        playsinline: 1,
        origin: window.location.origin,
        widget_referrer: window.location.origin,
        showinfo: 0,
        annotation: 0,
        vq: 'hd1080'
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    };
    
    // Configurações específicas para vídeos do formato Shorts
    if (isShorts) {
      playerConfig.playerVars = {
        ...playerConfig.playerVars,
        loop: 1,
        playsinline: 1,
        controls: 1, // Permitir controles para Shorts
        // Apenas opções suportadas pelo API do YouTube
        fs: 1 // Permitir tela cheia para formato vertical
      };
    }
    
    const ytPlayer = new window.YT.Player(playerElementRef.current, playerConfig);
    
    setPlayer(ytPlayer);
  };
  
  // Quando o player estiver pronto
  const onPlayerReady = (event: any) => {
    setIsLoaded(true);
    // Iniciar com o vídeo mudo e depois ativar o som
    // Isso é uma técnica para contornar as restrições de autoplay
    event.target.unMute();
    event.target.playVideo();
    
    // Tenta limpar os elementos indesejados do YouTube
    setTimeout(() => {
      cleanYouTubePlayer();
    }, 500);
  };
  
  // Quando o estado do player mudar
  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      // Tentar limpar elementos quando o vídeo começa a tocar
      cleanYouTubePlayer();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (event.data === window.YT.PlayerState.ENDED) {
      // Quando o vídeo terminar, executar ação de fechar se fornecida
      if (onClose) {
        onClose();
      }
    }
  };
  
  // Funções para controlar o player
  const togglePlay = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (!player) return;
    
    if (isMuted) {
      player.unMute();
    } else {
      player.mute();
    }
    
    setIsMuted(!isMuted);
  };
  
  // Controle do estado de tela cheia
  const handleFullscreen = () => {
    if (!playerContainerRef.current) return;
    
    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Monitorar mudanças no estado de tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Executar limpeza de elementos indesejados em intervalos
  useEffect(() => {
    if (isLoaded) {
      // Executar a limpeza periodicamente para garantir que elementos não reapareçam
      const cleanInterval = setInterval(() => {
        cleanYouTubePlayer();
      }, 2000);
      
      return () => {
        clearInterval(cleanInterval);
      };
    }
  }, [isLoaded]);
  
  return (
    <div 
      ref={playerContainerRef}
      className={`video-player-container relative w-full h-full ${isShorts ? 'aspect-[9/16] max-w-[400px] mx-auto' : 'aspect-video'} bg-black overflow-hidden`}
    >
      {/* Botão de fechar */}
      <button 
        onClick={onClose}
        className="video-close-button"
        aria-label="Fechar vídeo"
      >
        <X className="h-4 w-4" />
      </button>
      
      {/* Placeholder para o player do YouTube */}
      <div 
        ref={playerElementRef} 
        className="w-full h-full"
      ></div>
      
      {/* Controles personalizados */}
      {isLoaded && (
        <div className="video-controls">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              className="video-control-button"
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            
            <button 
              onClick={toggleMute}
              className="video-control-button"
              aria-label={isMuted ? "Ativar som" : "Desativar som"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            
            {title && (
              <div className="video-title">
                {title}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleFullscreen}
            className="video-control-button"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}