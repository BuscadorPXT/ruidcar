import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BlogPost } from '@shared/schema';
import { fadeUpVariants } from '@/lib/animations';
import { BlogImage } from '@/components/BlogImageManager';

export default function BlogPostPage() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const slug = location.split('/blog/')[1];
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Calculate read time in minutes (rough estimate)
  const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime;
  };
  
  // Fetch post data from API
  const { 
    data,
    isLoading,
    error 
  } = useQuery({ 
    queryKey: ['/api/blog', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/${slug}`);
      if (!response.ok) throw new Error('Post not found');
      return response.json();
    },
    retry: 1,
    enabled: !!slug
  });
  
  const post = data?.post as BlogPost | undefined;
  
  // Share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copiado para a área de transferência'))
        .catch(err => console.error('Erro ao copiar: ', err));
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando post...</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-grow pt-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-secondary mb-4">
              {t('blog.notFound')}
            </h1>
            <p className="text-gray-600 mb-8">
              O post que você está procurando não foi encontrado ou não está disponível.
            </p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('blog.backToList')}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-grow pt-16">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Navigation */}
          <div className="mb-8">
            <Link href="/blog">
              <Button variant="ghost" className="pl-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('blog.backToList')}
              </Button>
            </Link>
          </div>
          
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
          >
            {post.featuredImage && (
              <div className="rounded-xl overflow-hidden mb-8 max-h-96">
                <img 
                  src={post.featuredImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6">
              <span>{post.publishedAt ? formatDate(post.publishedAt) : ''}</span>
              <span className="mx-2">•</span>
              <span>{getReadTime(post.content)} {t('blog.minutesToRead')}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('blog.share')}
              </Button>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <Separator className="mb-8" />
          </motion.div>
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg max-w-none"
          >
            <ReactMarkdown
              components={{
                img: ({node, ...props}) => (
                  <BlogImage src={props.src || ''} alt={props.alt || ''} />
                )
              }}
            >
              {post.content}
            </ReactMarkdown>
          </motion.div>
          
          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <Link href="/blog">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('blog.backToList')}
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('blog.share')}
              </Button>
            </div>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}