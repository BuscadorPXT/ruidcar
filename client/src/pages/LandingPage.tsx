import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { MapPin, Info, PhoneCall } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const cards = [
    {
      id: 'workshop',
      href: 'https://localize.ruidcar.com.br',
      external: true,
      icon: <MapPin className="h-5 w-5 text-white" />,
      emoji: '🔧',
      title: t('landing.findWorkshop', 'Localizar oficina credenciada'),
      copy: t(
        'landing.findWorkshopDescription',
        'Visualize no mapa o ponto de atendimento mais próximo e inicie o agendamento instantaneamente.'
      ),
      badge: t('landing.badge.field', 'Mapa em tempo real'),
      className:
        "border-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,_rgba(255,95,0,0.35),_rgba(20,20,20,0.8))] before:opacity-80 before:content-['']"
    },
    {
      id: 'product',
      href: '/home',
      external: false,
      icon: <Info className="h-5 w-5 text-primary" />,
      emoji: '✨',
      title: t('landing.moreInfo', 'Conhecer o RuidCar em detalhes'),
      copy: t(
        'landing.moreInfoDescription',
        'Explore benefícios, casos reais e calcule o retorno sobre investimento para a sua operação.'
      ),
      badge: t('landing.badge.showcase', 'Tour completo'),
      className:
        'border border-primary/20 bg-white text-slate-900 shadow-lg shadow-primary/10 hover:shadow-xl'
    },
    {
      id: 'contact',
      href: 'https://wa.me/554999992055',
      external: true,
      icon: <PhoneCall className="h-5 w-5 text-white" />,
      emoji: '🤝',
      title: t('landing.contact.title', 'Falar com um especialista agora'),
      copy: t(
        'landing.contact.description',
        'Tire dúvidas comerciais em português ou inglês e receba um plano sob medida para sua oficina.'
      ),
      badge: t('landing.badge.response', 'Resposta em poucos minutos'),
      className:
        'border-transparent bg-gradient-to-br from-primary via-primary/90 to-orange-400 text-white shadow-[0_15px_45px_rgba(255,95,0,0.35)] hover:shadow-[0_18px_55px_rgba(255,95,0,0.45)]'
    }
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 sm:px-6 md:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-slate-400/10 blur-3xl" />
      </div>
      <div className="w-full max-w-5xl rounded-3xl border border-white/60 bg-white/70 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isImageLoaded ? 1 : 0, y: isImageLoaded ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full max-w-[220px] md:max-w-[260px]">
            <img
              src="/assets/logo.png"
              alt="RuidCar Logo"
              className="h-auto w-full"
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>

          <motion.h1
            className="mt-8 text-3xl font-bold text-slate-900 md:text-4xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t('landing.title', 'Como podemos te ajudar hoje?')}
          </motion.h1>
          <motion.p
            className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t(
              'landing.subtitle',
              'Escolha o melhor caminho para avançar com o diagnóstico inteligente de ruídos automotivos.'
            )}
          </motion.p>

          <div
            className={cn(
              'mt-12 grid w-full gap-6',
              isMobile ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3'
            )}
          >
            {cards.map((card, index) => {
              const isDarkCard = card.id !== 'product';
              const content = (
                <motion.div
                  key={card.id}
                  className={cn(
                    'group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6 text-left transition-transform duration-300 ease-out hover:-translate-y-1',
                    card.className
                  )}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.15 * index }}
                >
                  <div className="relative z-10 flex flex-col gap-4">
                    <span
                      className={cn(
                        'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition-colors',
                        isDarkCard
                          ? 'border border-white/20 bg-white/10 text-white/80'
                          : 'border border-primary/20 bg-primary/5 text-primary/80'
                      )}
                    >
                      {card.icon}
                      {card.badge}
                    </span>
                    <div className="text-4xl" aria-hidden="true">
                      {card.emoji}
                    </div>
                    <h2
                      className={cn(
                        'text-2xl font-semibold leading-snug',
                        isDarkCard ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {card.title}
                    </h2>
                    <p
                      className={cn(
                        'text-sm md:text-base',
                        isDarkCard ? 'text-white/80' : 'text-slate-600'
                      )}
                    >
                      {card.copy}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'relative z-10 mt-8 flex items-center gap-2 text-sm font-semibold',
                      isDarkCard ? 'text-white' : 'text-primary'
                    )}
                  >
                    <span>{t('landing.cta', 'Continuar')}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </motion.div>
              );

              if (card.external) {
                return (
                  <a
                    key={card.id}
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link key={card.id} href={card.href}>
                  <a className="block h-full">{content}</a>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
