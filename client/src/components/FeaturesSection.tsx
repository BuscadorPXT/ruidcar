import { motion } from "framer-motion";
import { Clock, BarChart3, Wallet } from "lucide-react";
import { useInView } from "framer-motion";
import { useRef } from "react";

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });
  
  const features = [
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      eyebrow: "Velocidade",
      title: "Diagnóstico em minutos",
      description: "Localize o ruído em 5 a 30 minutos com inteligência acústica guiada passo a passo."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      eyebrow: "Resultado",
      title: "200% de aumento médio",
      description: "Oficinas parceiras monetizam relatórios premium e elevam o ticket médio." 
    },
    {
      icon: <Wallet className="h-6 w-6 text-primary" />,
      eyebrow: "Novo serviço",
      title: "Fluxo extra de receita",
      description: "Venda laudos especializados por até R$700 e fidelize clientes com transparência."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white py-20"
    >
      <div className="absolute inset-x-0 top-16 -z-10 h-72 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.span
            className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            RuidCar na sua oficina
          </motion.span>

          <motion.h2
            className="mt-6 text-3xl font-bold text-slate-900 md:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            Por que líderes de oficina escolhem o RuidCar
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Menos tentativa e erro, mais confiança na entrega. Veja os pilares que sustentam nosso impacto.
          </motion.p>
        </div>

        <motion.div
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-lg"
              variants={itemVariants}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                {feature.icon}
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
                {feature.eyebrow}
              </span>
              <h3 className="text-2xl font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="text-slate-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
