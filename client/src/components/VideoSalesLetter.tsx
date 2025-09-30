import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { CustomVideoPlayer } from './CustomVideoPlayer';

interface VideoSalesLetterProps {
  videoId?: string;
  thumbnailUrl?: string;
  title?: string;
}

export default function VideoSalesLetter({ 
  videoId = "mui5tsyfXiE", // ID do vídeo do YouTube
  thumbnailUrl = "https://i.ytimg.com/vi/mui5tsyfXiE/maxresdefault.jpg", // Thumbnail do YouTube
  title = "Descubra como o RuidCar revoluciona diagnósticos automotivos"
}: VideoSalesLetterProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Desativar scroll quando o vídeo estiver reproduzindo
  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlaying]);
  
  const toggleVideo = () => {
    setIsPlaying(!isPlaying);
  };
  
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg relative bg-secondary/5">
      <div className="relative aspect-video">
        {isPlaying ? (
          <div className="relative w-full h-full">
            <CustomVideoPlayer 
              videoId={videoId} 
              title={title} 
              thumbnailUrl={thumbnailUrl}
              onClose={toggleVideo}
            />
          </div>
        ) : (
          <div 
            className="w-full h-full cursor-pointer"
            onClick={toggleVideo}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40">
              <h3 className="text-white text-xl md:text-2xl font-bold text-center mb-6 px-6">
                {title}
              </h3>
              <motion.div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="h-8 w-8 md:h-10 md:w-10 text-white ml-1" />
              </motion.div>
              <p className="text-white text-sm mt-4">{t('vsl.watch')}</p>
            </div>
            <img 
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}