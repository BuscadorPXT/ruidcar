import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Award, Verified, Video } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CustomVideoPlayer } from './CustomVideoPlayer';

interface DemoVideoProps {
  buttonVariant?: 'default' | 'compact';
}

export default function DemoVideo({ buttonVariant = 'default' }: DemoVideoProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  // ID do vídeo do YouTube (versão hospedada do vídeo da Volkswagen)
  const youtubeVideoId = "PJ_TuEoxPY0";

  return (
    <Dialog>
      <DialogTrigger asChild>
        {buttonVariant === 'default' ? (
          <Button 
            size="lg" 
            variant="outline" 
            className="group relative overflow-hidden bg-white border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
          >
            <span className="absolute inset-0 w-full h-full bg-primary/10 group-hover:bg-primary/0 transition-colors"></span>
            <div className="relative flex items-center gap-2">
              <div className="bg-primary/20 rounded-full p-1 group-hover:bg-white/20 transition-colors">
                <Play className="h-4 w-4 fill-primary group-hover:fill-white transition-colors" />
              </div>
              {t('demo.watch')}
            </div>
          </Button>
        ) : (
          <Button 
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
          >
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>{t('hero.watch_demo')}</span>
            </div>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-1 bg-gray-900 border-gray-800" onInteractOutside={() => setIsPlaying(false)}>
        <div className="aspect-video w-full relative rounded overflow-hidden">
          {/* Badge de "Homologado pela Volkswagen" */}
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-black/70 text-white py-1 px-3 rounded-full flex items-center text-sm font-medium backdrop-blur-sm">
              <Verified className="h-4 w-4 text-blue-400 mr-1" />
              <span className="mr-1">{t('demo.approved_by')}</span>
              <span className="font-bold text-blue-300">Volkswagen</span>
            </div>
          </div>
          
          {/* Usar o player de YouTube em vez do vídeo MP4 */}
          <CustomVideoPlayer 
            videoId={youtubeVideoId}
            title={t('demo.title')}
            onClose={() => setIsPlaying(false)}
          />
        </div>
        
        <div className="bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">{t('demo.title')}</h3>
          </div>
          <p className="text-gray-300 text-sm">
            {t('demo.description')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}