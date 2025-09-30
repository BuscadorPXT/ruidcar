import { lazy, useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import OnboardingTour, { useOnboarding } from "@/components/OnboardingTour";
import { homePageTourSteps } from "@/data/onboardingSteps";
import LazySection from "@/components/LazySection";

interface SectionIntroProps {
  eyebrow: string;
  title: string;
  description: string;
}

const SectionIntro = ({ eyebrow, title, description }: SectionIntroProps) => (
  <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8">
    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
      {eyebrow}
    </p>
    <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">{title}</h2>
    <p className="mt-4 text-lg text-slate-600">{description}</p>
  </div>
);

// Lazy load heavy components
const RoiCalculator = lazy(() => import("@/components/RoiCalculator"));
const MarketPricing = lazy(() => import("@/components/MarketPricing"));
const SuccessCases = lazy(() => import("@/components/SuccessCases"));
const TechnicalSpecs = lazy(() => import("@/components/TechnicalSpecs"));
const MediaSection = lazy(() => import("@/components/MediaSection"));
const ContactForm = lazy(() => import("@/components/ContactForm"));
const InfluencersSection = lazy(() => import("@/components/InfluencersSection"));
const PatentedProduct = lazy(() => import("@/components/PatentedProduct"));
const TestimonialsGallery = lazy(() => import("@/components/TestimonialsGallery"));
const CustomizationGallery = lazy(() => import("@/components/CustomizationGallery"));

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const { showTour = false, completeTour = () => {}, skipTour = () => {} } = useOnboarding() || {};

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state briefly to avoid white flash
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow pt-16">
        <div data-tour="hero-section">
          <HeroSection />
        </div>
        <FeaturesSection />
        <SectionIntro
          eyebrow="Produto"
          title="Conheça como o RuidCar funciona por dentro"
          description="Tecnologia patenteada, inteligência acústica e um fluxo guiado criado junto com oficinas referência."
        />
        <div data-tour="patented-product">
          <div className="py-12">
            <LazySection
              component={() => import("@/components/PatentedProduct")}
              threshold={0.1}
            />
          </div>
        </div>
        <div data-tour="roi-calculator">
          <div className="py-12">
            <LazySection
              component={() => import("@/components/RoiCalculator")}
              threshold={0.1}
            />
          </div>
        </div>
        <SectionIntro
          eyebrow="Oferta"
          title="Escolha o plano certo para a sua operação"
          description="Transparência total em equipamentos, implantação e suporte. Sem letras miúdas."
        />
        <div className="py-12">
          <LazySection
            component={() => import("@/components/MarketPricing")}
            threshold={0.1}
          />
        </div>
        <div data-tour="technical-specs">
          <div className="py-12">
            <LazySection
              component={() => import("@/components/TechnicalSpecs")}
              threshold={0.1}
            />
          </div>
        </div>
        <SectionIntro
          eyebrow="Experiência"
          title="Visualize personalizações e materiais de apoio"
          description="Deixe o equipamento com a cara da sua oficina e use conteúdos prontos para vender o serviço."
        />
        <div className="py-12">
          <LazySection
            component={() => import("@/components/CustomizationGallery")}
            threshold={0.1}
          />
        </div>
        <div className="py-12">
          <LazySection
            component={() => import("@/components/InfluencersSection")}
            threshold={0.1}
          />
        </div>
        <div data-tour="testimonials" className="py-12">
          <LazySection
            component={() => import("@/components/TestimonialsGallery")}
            threshold={0.1}
          />
        </div>
        <div data-tour="success-cases" className="py-12">
          <LazySection
            component={() => import("@/components/SuccessCases")}
            threshold={0.1}
          />
        </div>
        <SectionIntro
          eyebrow="Conteúdo"
          title="Veja o RuidCar em ação"
          description="Acompanhe demonstrações reais, mídia espontânea e entrevistas com especialistas."
        />
        <div className="py-12">
          <LazySection
            component={() => import("@/components/MediaSection")}
            threshold={0.1}
          />
        </div>
        <div data-tour="contact-form" className="py-12">
          <LazySection
            component={() => import("@/components/ContactForm")}
            threshold={0.1}
          />
        </div>
      </main>
      <Footer />

      {/* Onboarding Tour - only render if not causing issues */}
      {showTour && (
        <OnboardingTour
          steps={homePageTourSteps}
          isOpen={showTour}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </div>
  );
}
