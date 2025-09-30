import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Link } from 'wouter';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlogPost } from '@shared/schema';
import { fadeUpVariants, staggerContainerVariants } from '@/lib/animations';

export default function BlogPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch posts from the API
  const { 
    data: postsData,
    isLoading,
    error 
  } = useQuery({ 
    queryKey: ['/api/blog'],
    retry: 1
  });

  // Fetch featured posts
  const { 
    data: featuredData,
    isLoading: loadingFeatured,
  } = useQuery({ 
    queryKey: ['/api/blog/featured'],
    retry: 1
  });

  const posts = postsData?.posts || [];
  const featuredPosts = featuredData?.posts || [];

  // Filter posts based on search term
  const filteredPosts = posts.filter((post: BlogPost) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(searchLower) ||
      post.metaDescription.toLowerCase().includes(searchLower) ||
      post.excerpt.toLowerCase().includes(searchLower) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-white py-16 md:py-24">
          <div className="container px-4 mx-auto">
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
                {t('blog.title')}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {t('blog.subtitle')}
              </p>

              <div className="relative max-w-xl mx-auto">
                <Input
                  type="text"
                  placeholder={t('blog.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-12 md:py-16 bg-white">
            <div className="container px-4 mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-8">
                {t('blog.featured')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredPosts.map((post: BlogPost) => (
                  <motion.div 
                    key={post.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transform transition-transform hover:scale-[1.02]"
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                      <div className="h-52 overflow-hidden">
                        <img 
                          src={post.id === 2 ? "/img/ruidcar-blue.jpg" : "/img/ruidcar-dual-system.jpg"} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    <div className="p-6 flex-grow">
                      <div className="flex items-center mb-2">
                        <span className="text-xs text-gray-500">
                          {post.publishedAt ? formatDate(post.publishedAt) : ''}
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {getReadTime(post.content)} {t('blog.minutesToRead')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-secondary line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="link" className="p-0 h-auto font-semibold text-primary">
                          {t('blog.readMore')} →
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container px-4 mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-8">
              {t('blog.recentPosts')}
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando posts...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">Erro ao carregar posts.</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">{t('blog.noResults')}</p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredPosts.map((post: BlogPost) => (
                  <motion.div 
                    key={post.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full transform transition-transform hover:scale-[1.02]"
                    variants={fadeUpVariants}
                    whileHover={{ y: -5 }}
                  >
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={
                            post.id === 2 
                              ? "/img/ruidcar-featured.jpg" 
                              : post.id === 3 
                                ? "/img/ruidcar-main.jpg" 
                                : "/img/ruidcar-orange.jpg"
                          } 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    <div className="p-6 flex-grow">
                      <div className="flex items-center mb-2">
                        <span className="text-xs text-gray-500">
                          {post.publishedAt ? formatDate(post.publishedAt) : ''}
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {getReadTime(post.content)} {t('blog.minutesToRead')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-secondary line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                        {post.excerpt}
                      </p>

                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="link" className="p-0 h-auto font-semibold text-primary">
                          {t('blog.readMore')} →
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}