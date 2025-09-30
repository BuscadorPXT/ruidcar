import { Button } from "@/components/ui/button";
import { StarBorder } from "@/components/ui/star-border";
import { motion } from "framer-motion";
import { Award, CheckCircle } from "lucide-react";
import DemoVideo from "@/components/DemoVideo";
import VideoSalesLetter from "@/components/VideoSalesLetter";
import { useTranslation } from "react-i18next";

import ruidcarImg from "@assets/ruidcar-white.jpg";

export default function HeroSection() {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const rawTitle = t('hero.headline', 'Diagnóstico de ruídos automotivos em minutos.');
  const brandLabel = t('hero.brand', 'RUIDCAR');
  const subHeadline = t(
    'hero.kicker',
    'Tecnologia homologada que amplia faturamento e confiança da sua oficina.'
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-100">
      <div className="absolute inset-0 -z-20">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover opacity-25"
        >
          <source src="/assets/videos/ruidcar-bg.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 -z-10 bg-white/85" />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 mt-6 max-w-5xl rounded-2xl border border-primary/10 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-serif italic text-slate-600">
            "Clama a mim, e responder-te-ei e anunciar-te-ei coisas grandes e firmes, que não sabes."
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Jeremias 33:3
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center lg:text-left">
          <motion.p
            className="mx-auto mb-4 max-w-2xl text-sm font-semibold uppercase tracking-[0.35em] text-primary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          {t('hero.tagline', 'Diagnóstico inteligente, rápido e mais preciso')}
          </motion.p>

          <motion.h1
            className="mx-auto mb-6 max-w-3xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:mx-0 lg:max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary">{brandLabel}</span>{' '}
            {rawTitle}
          </motion.h1>

          <motion.h2
            className="mx-auto max-w-3xl text-base text-slate-600 md:text-xl lg:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {subHeadline}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
              <VideoSalesLetter title={t('vsl.title')} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
                <Award className="h-4 w-4" />
                {t('vsl.badges.volkswagen')}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
                <CheckCircle className="h-4 w-4" />
                {t('vsl.badges.workshops')}
              </span>
            </div>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <StarBorder
                as="a"
                href="/home#contact"
                className="w-full text-lg font-semibold"
                variant="premium"
              >
                {t('hero.cta.demo')}
              </StarBorder>
              <Button
                asChild
                variant="outline"
                className="w-full border border-primary/30 text-primary hover:text-primary"
              >
                <a href="#calculator">{t('hero.cta.calculator')}</a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative flex flex-col gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:grid-cols-[0.9fr_1.1fr]"
              variants={itemVariants}
            >
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <img
                  src={ruidcarImg}
                  alt={t('hero.imageAlt', 'Equipamento RuidCar no box da oficina')}
                  className="h-44 w-full rounded-xl object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-4 text-slate-900">
                <p className="text-sm uppercase tracking-[0.3em] text-primary/70">
                  {t('hero.results.title')}
                </p>
                <h3 className="text-2xl font-semibold leading-tight">
                  {t('hero.results.heading', 'Resultados que se pagam em poucos diagnósticos')}
                </h3>
                <p className="text-sm text-slate-600">
                  {t('hero.results.support', 'Processos guiados e leitura precisa para diagnósticos confiáveis e rápidos.')}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-lg sm:grid-cols-3"
              variants={itemVariants}
            >
              <div>
                <p className="text-xs uppercase text-slate-500">{t('hero.results.diagnose.label')}</p>
                <p className="text-3xl font-bold text-primary">{t('hero.results.diagnose.value')}</p>
                <p className="text-xs text-slate-500">{t('hero.results.diagnose.comparison')}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">{t('hero.results.revenue.label')}</p>
                <p className="text-3xl font-bold text-primary">{t('hero.results.revenue.value')}</p>
                <p className="text-xs text-slate-500">{t('hero.results.revenue.description')}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">{t('hero.results.conversion.label')}</p>
                <p className="text-3xl font-bold text-primary">{t('hero.results.conversion.value')}</p>
                <p className="text-xs text-slate-500">{t('hero.results.conversion.description')}</p>
              </div>
            </motion.div>

            <motion.p className="text-xs text-slate-500" variants={itemVariants}>
              * {t(
                'hero.results.disclaimer',
                'Tempo estimado com base em atendimentos anteriores. Resultados podem variar.'
              )}
            </motion.p>

            <motion.div variants={itemVariants}>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
                <DemoVideo buttonVariant="default" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
