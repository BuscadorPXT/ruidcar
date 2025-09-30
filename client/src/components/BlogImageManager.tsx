import React from 'react';

interface BlogImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Componente para renderizar imagens de blog com estilo consistente
 */
export const BlogImage: React.FC<BlogImageProps> = ({ src, alt, className }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`rounded-lg ${className || 'my-4 max-w-full h-auto'}`}
    />
  );
};