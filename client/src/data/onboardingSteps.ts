import type { TourStep } from '@/types/onboarding';

export const homePageTourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="hero-section"]',
    title: 'Bem-vindo ao RuidCar! 👋',
    description: 'Conheça a tecnologia revolucionária que está transformando o diagnóstico automotivo no Brasil e no mundo.',
    position: 'bottom'
  },
  {
    id: 'product-info',
    target: '[data-tour="patented-product"]',
    title: 'Produto Patenteado',
    description: 'O RuidCar é uma tecnologia patenteada que utiliza simulação real de condições de estrada para detectar ruídos com precisão inédita.',
    position: 'top'
  },
  {
    id: 'roi-calculator',
    target: '[data-tour="roi-calculator"]',
    title: 'Calculadora de ROI 📊',
    description: 'Descubra quanto sua oficina pode economizar e ganhar com o RuidCar. Personalize os valores para sua realidade.',
    position: 'top',
    action: () => {
      const element = document.querySelector('[data-tour="roi-calculator"]');
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  {
    id: 'specifications',
    target: '[data-tour="technical-specs"]',
    title: 'Especificações Técnicas',
    description: 'Veja todos os detalhes técnicos do equipamento, incluindo precisão, compatibilidade e requisitos.',
    position: 'top'
  },
  {
    id: 'testimonials',
    target: '[data-tour="testimonials"]',
    title: 'Depoimentos de Clientes',
    description: 'Veja o que nossos clientes dizem sobre os resultados obtidos com o RuidCar em suas oficinas.',
    position: 'top'
  },
  {
    id: 'contact',
    target: '[data-tour="contact-form"]',
    title: 'Entre em Contato 📞',
    description: 'Pronto para investir? Preencha o formulário e nossa equipe entrará em contato para personalizar uma proposta.',
    position: 'top',
    action: () => {
      const element = document.querySelector('[data-tour="contact-form"]');
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  }
];

export const blogPageTourSteps: TourStep[] = [
  {
    id: 'blog-welcome',
    target: '[data-tour="blog-header"]',
    title: 'Blog RuidCar 📚',
    description: 'Aqui você encontra artigos técnicos, casos de sucesso e novidades sobre diagnóstico automotivo.',
    position: 'bottom'
  },
  {
    id: 'search',
    target: '[data-tour="blog-search"]',
    title: 'Busca Inteligente',
    description: 'Use a busca para encontrar artigos específicos sobre temas que interessam à sua oficina.',
    position: 'bottom'
  },
  {
    id: 'featured',
    target: '[data-tour="featured-posts"]',
    title: 'Posts em Destaque',
    description: 'Artigos mais importantes e atuais sobre tecnologia automotiva e cases de sucesso.',
    position: 'top'
  }
];

export const mapPageTourSteps: TourStep[] = [
  {
    id: 'map-welcome',
    target: '[data-tour="map-container"]',
    title: 'Mapa de Oficinas Parceiras 🗺️',
    description: 'Encontre oficinas que já utilizam a tecnologia RuidCar próximas a você.',
    position: 'bottom'
  },
  {
    id: 'search-location',
    target: '[data-tour="location-search"]',
    title: 'Busca por Localização',
    description: 'Digite sua cidade ou deixe o sistema detectar automaticamente sua localização.',
    position: 'bottom'
  },
  {
    id: 'workshop-details',
    target: '[data-tour="workshop-list"]',
    title: 'Detalhes das Oficinas',
    description: 'Veja informações detalhadas, avaliações e formas de contato de cada oficina parceira.',
    position: 'left'
  }
];

// Configurações específicas por tipo de usuário
export const getTourStepsForUserType = (userType: 'owner' | 'customer' | 'partner'): TourStep[] => {
  const baseSteps = homePageTourSteps;

  switch (userType) {
    case 'owner':
      return [
        ...baseSteps,
        {
          id: 'business-benefits',
          target: '[data-tour="success-cases"]',
          title: 'Cases de Sucesso 🏆',
          description: 'Veja como outras oficinas aumentaram sua receita e eficiência com o RuidCar.',
          position: 'top'
        }
      ];

    case 'customer':
      return [
        {
          id: 'customer-welcome',
          target: '[data-tour="hero-section"]',
          title: 'Procurando Diagnóstico Preciso? 🔍',
          description: 'O RuidCar oferece diagnósticos muito mais precisos para problemas no seu veículo.',
          position: 'bottom'
        },
        {
          id: 'find-workshop',
          target: '[data-tour="workshop-locator"]',
          title: 'Encontre uma Oficina',
          description: 'Use nosso mapa para encontrar oficinas certificadas RuidCar próximas a você.',
          position: 'top'
        }
      ];

    case 'partner':
      return [
        ...baseSteps,
        {
          id: 'partnership',
          target: '[data-tour="partnership-info"]',
          title: 'Programa de Parceria 🤝',
          description: 'Saiba como se tornar um parceiro RuidCar e expandir seus negócios.',
          position: 'top'
        }
      ];

    default:
      return baseSteps;
  }
};