import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { detectUserLocation } from './lib/locationDetector';

// Recursos de tradução
const resources = {
  // Português do Brasil
  'pt-BR': {
    translation: {
      // Componentes de navegação
      nav: {
        home: 'Início',
        about: 'Sobre',
        features: 'Funcionalidades',
        roi: 'Retorno',
        specs: 'Especificações',
        testimonials: 'Depoimentos',
        contact: 'Contato',
      },
      
      // Seção Hero
      hero: {
        title: 'RuidCar: A Tecnologia Patenteada que Dobra o Faturamento da Sua Oficina',
        subtitle: 'Diagnósticos mais precisos e um novo serviço altamente lucrativo para sua oficina',
        cta: {
          demo: 'Quero Faturar Mais',
          calculator: 'Calcule seu Potencial de Faturamento',
        },
        results: {
          title: 'Resultados comprovados:',
          diagnose: {
            label: 'Diagnósticos em',
            value: '5-30 minutos*',
            comparison: 'contra 2+ horas no método tradicional',
          },
          revenue: {
            label: 'Aumento médio de',
            value: '200%',
            description: 'no faturamento mensal das oficinas',
          },
          conversion: {
            label: 'Taxa de conversão',
            value: '90%',
            description: 'dos diagnósticos viram serviços',
          },
        },
        watch_demo: 'Demonstração técnica do RuidCar',
      },
      
      // Demonstração de vídeo
      demo: {
        watch: 'Assista à Demonstração',
        approved_by: 'Homologado pela',
        title: 'RuidCar - Tecnologia Homologada',
        description: 'Assista à demonstração do RuidCar, o único equipamento de diagnóstico de ruídos automotivos com tecnologia patenteada e homologado pela Volkswagen.',
      },

      // VSL (Video Sales Letter)
      vsl: {
        title: 'Descubra como o RuidCar revoluciona diagnósticos automotivos',
        watch: 'Assista ao vídeo de apresentação',
        badges: {
          volkswagen: 'Homologado pela Volkswagen',
          workshops: '+200 oficinas atendidas',
        },
      },
      
      // Seção de funcionalidades
      features: {
        title: 'Funcionalidades Exclusivas',
        subtitle: 'Tecnologia patenteada para diagnóstico de ruídos automotivos',
        items: {
          precision: {
            title: 'Precisão Incomparável',
            description: 'Identifica com exatidão a origem dos ruídos, eliminando as suposições',
          },
          speed: {
            title: 'Diagnósticos Mais Rápidos',
            description: 'Finalize diagnósticos em menos tempo que normalmente levariam horas pelo método tradicional',
          },
          easy: {
            title: 'Fácil de Usar',
            description: 'Interface intuitiva que não exige conhecimentos técnicos avançados',
          },
          reliable: {
            title: 'Resultados Mais Confiáveis',
            description: 'Maior precisão nos diagnósticos comparado ao método tradicional',
          },
          warranty: {
            title: '1 Ano de Garantia',
            description: 'Suporte técnico e garantia total no equipamento',
          },
          training: {
            title: 'Treinamento Incluído',
            description: 'Capacitação completa para sua equipe utilizar o equipamento',
          },
        },
      },
      
      // Seção de ROI
      roi: {
        title: 'Retorno sobre Investimento',
        description: 'Nossas oficinas parceiras recuperam o investimento rapidamente e expandem seus negócios com um serviço exclusivo de diagnóstico de ruídos.',
        benefits: {
          time: 'Diagnósticos em <strong>5 a 30 minutos*</strong> vs. 2+ horas no método tradicional. Obs: este é apenas um tempo estimado com base em atendimentos anteriores e pode variar conforme o caso.',
          revenue: 'Aumento médio de <strong>200%</strong> no faturamento de diagnósticos',
          conversion: 'Taxa de conversão de <strong>90%</strong> para serviços adicionais',
        },
        cta: 'Calcule seu Potencial de Retorno',
        recovery: {
          title: 'Nossos clientes recuperam o valor investido em:',
          time: '3-6',
          months: 'meses',
        },
        metrics: {
          service_value: 'Valor médio por diagnóstico',
          monthly_diagnosis: 'Diagnósticos mensais',
          additional_revenue: 'Faturamento adicional',
          disclaimer: 'Baseado em dados reais de oficinas parceiras',
        },
      },
      
      // Reconhecimentos e homologações
      recognition: {
        title: 'Reconhecimento & Homologações',
        description: 'O RuidCar é reconhecido e homologado por grandes montadoras e recebeu a aprovação dos principais influenciadores do setor automotivo.',
        vw: {
          title: 'Homologado pela Volkswagen',
          description: 'Aprovado pelos padrões de qualidade da montadora',
        },
        experts: {
          title: 'Endossado por Especialistas',
          description: 'Influenciadores com milhões de seguidores recomendam',
        },
        cta: 'Fale com nossa equipe',
        partners: {
          title: 'Nossos Parceiros e Apoiadores',
          subtitle: 'Confiado por profissionais e empresas referência do setor',
        },
      },
      
      // Calculadora ROI
      calculator: {
        title: 'Calculadora de Retorno sobre Investimento',
        subtitle: 'Calcule quanto sua oficina pode faturar com o RuidCar',
        form: {
          services: {
            label: 'Serviços mensais',
            help: 'Quantos serviços sua oficina realiza por mês?',
          },
          ticket: {
            label: 'Ticket médio',
            help: 'Qual é o valor médio de um serviço?',
          },
          noise: {
            label: 'Problemas de ruído (%)',
            help: 'Porcentagem de clientes com problemas de ruído',
          },
          diagnosis: {
            label: 'Valor do diagnóstico',
            help: 'Quanto cobrar pelo diagnóstico de ruído',
          },
          calculate: 'Calcular Potencial',
        },
        results: {
          title: 'Seu Potencial de Faturamento Adicional',
          diagnosis: {
            title: 'Diagnósticos/mês',
            description: 'Diagnósticos de ruído realizados',
          },
          revenue: {
            title: 'Receita com diagnósticos',
            description: 'Valor arrecadado com diagnósticos',
          },
          services: {
            title: 'Serviços adicionais',
            description: 'Valor de serviços resultantes',
          },
          total: {
            title: 'Receita adicional total',
            description: 'Faturamento adicional mensal',
          },
          roi: {
            title: 'ROI estimado',
            description: 'Retorno sobre investimento',
          },
        },
      },
      
      // Formulário de contato
      contact: {
        title: 'Transforme Sua Oficina Hoje',
        subtitle: 'Entre em contato para saber mais sobre o RuidCar e como ele pode revolucionar seu negócio.',
        requestInfo: 'Solicite mais informações',
        form: {
          fullName: 'Nome completo',
          email: 'Email',
          whatsapp: 'WhatsApp',
          whatsappPlaceholder: 'Insira seu WhatsApp com DDD',
          searchCountry: 'Buscar país...',
          countryNotFound: 'País não encontrado',
          company: 'Empresa',
          businessType: 'Tipo de estabelecimento',
          businessTypePlaceholder: 'Tipo de estabelecimento',
          businessTypes: {
            workshop: 'Oficina Mecânica',
            armoringShop: 'Blindadora',
            autoCenter: 'Auto Center',
            other: 'Outro'
          },
          message: 'Mensagem',
          sending: 'Enviando...',
          submit: 'Enviar mensagem',
          success: 'Mensagem enviada com sucesso!',
          error: 'Erro ao enviar mensagem. Tente novamente.',
          address: 'Endereço',
        },
        contactInfo: 'Entre em contato',
        callToAction: 'Falar com a equipe',
        demoText: 'Veja o RuidCar em ação na sua oficina. Agende uma visita técnica sem compromisso.',
        whatsappCTA: 'Falar no WhatsApp',
      },
      
      // Seção de personalização
      customization: {
        title: 'Personalização RuidCar',
        subtitle: 'Equipamentos personalizados para sua empresa em diversas cores',
        options: 'Opções de cores',
        description: 'O RuidCar pode ser personalizado na cor da sua empresa, criando identidade visual e tornando-o um diferencial em seu negócio.',
        continental: '* Modelos especiais como o "RuidCar Continental" estão disponíveis para parceiros selecionados.',
        benefits: 'Benefícios da personalização',
        benefit1: 'Identidade visual alinhada com sua marca',
        benefit2: 'Destaque do equipamento em sua oficina',
        benefit3: 'Acabamento de alta qualidade e resistência'
      },
      
      // Footer
      footer: {
        rights: 'Todos os direitos reservados.',
        product: 'RuidCar é um produto patenteado.',
        privacy: 'Política de Privacidade',
        terms: 'Termos de Uso',
      },
      
      // Blog
      blog: {
        title: 'Blog RuidCar',
        subtitle: 'Dicas, novidades e informações sobre ruídos automotivos',
        readMore: 'Leia mais',
        featured: 'Destaque',
        recentPosts: 'Posts recentes',
        searchPlaceholder: 'Buscar artigos...',
        noResults: 'Nenhum resultado encontrado',
        share: 'Compartilhar',
        tags: 'Tags',
        relatedPosts: 'Posts relacionados',
        minutesToRead: 'min de leitura',
        backToList: 'Voltar para lista',
        notFound: 'Post não encontrado',
      },
      
      // Página inicial
      landing: {
        title: 'Como podemos te ajudar hoje?',
        findWorkshop: 'Quero localizar uma oficina',
        findWorkshopDescription: 'Encontre a oficina credenciada mais próxima de você',
        moreInfo: 'Quero mais informações sobre o equipamento',
        moreInfoDescription: 'Saiba mais sobre as características e benefícios do RuidCar',
      },
      
      // Landing page premium
      premium: {
        title: 'RuidCar Diagnostic Pro',
        subtitle: 'A solução definitiva para diagnóstico automotivo que revoluciona sua oficina com precisão e tecnologia de ponta.',
        buy: 'Compre',
        locate: 'Localize'
      },
      
    },
  },
  
  // Inglês (EUA)
  'en-US': {
    translation: {
      // Navigation components
      nav: {
        home: 'Home',
        about: 'About',
        features: 'Features',
        roi: 'ROI',
        specs: 'Specs',
        testimonials: 'Testimonials',
        contact: 'Contact',
      },
      
      // Hero section
      hero: {
        title: 'RuidCar: The Patented Technology that Doubles Your Workshop Revenue',
        subtitle: 'More precise diagnostics and a new highly profitable service for your workshop',
        cta: {
          demo: 'I Want to Earn More',
          calculator: 'Calculate Your Revenue Potential',
        },
        results: {
          title: 'Proven results:',
          diagnose: {
            label: 'Diagnostics in',
            value: '5-30 minutes*',
            comparison: 'vs. 2+ hours with traditional methods',
          },
          revenue: {
            label: 'Average increase of',
            value: '200%',
            description: 'in monthly workshop revenue',
          },
          conversion: {
            label: 'Conversion rate',
            value: '90%',
            description: 'of diagnostics become services',
          },
        },
        watch_demo: 'RuidCar Technical Demonstration',
      },
      
      // Video demonstration
      demo: {
        watch: 'Watch the Demo',
        approved_by: 'Approved by',
        title: 'RuidCar - Approved Technology',
        description: 'Watch the RuidCar demonstration, the only automotive noise diagnostic equipment with patented technology approved by Volkswagen.',
      },

      // VSL (Video Sales Letter)
      vsl: {
        title: 'Discover how RuidCar revolutionizes automotive diagnostics',
        watch: 'Watch the presentation video',
        badges: {
          volkswagen: 'Approved by Volkswagen',
          workshops: '200+ workshops served',
        },
      },
      
      // Features section
      features: {
        title: 'Exclusive Features',
        subtitle: 'Patented technology for automotive noise diagnostics',
        items: {
          precision: {
            title: 'Unmatched Precision',
            description: 'Accurately identifies the source of noises, eliminating guesswork',
          },
          speed: {
            title: 'Faster Diagnostics',
            description: 'Complete diagnostics in less time compared to traditional methods that would normally take hours',
          },
          easy: {
            title: 'User-Friendly',
            description: 'Intuitive interface that doesn\'t require advanced technical knowledge',
          },
          reliable: {
            title: 'More Reliable Results',
            description: 'Greater accuracy in diagnostics compared to traditional methods',
          },
          warranty: {
            title: '1 Year Warranty',
            description: 'Technical support and full equipment warranty',
          },
          training: {
            title: 'Training Included',
            description: 'Complete training for your team to use the equipment',
          },
        },
      },
      
      // ROI section
      roi: {
        title: 'Return on Investment',
        description: 'Our partner workshops recover their investment quickly and expand their business with an exclusive noise diagnostic service.',
        benefits: {
          time: 'Diagnostics in <strong>5 to 30 minutes*</strong> vs. 2+ hours with traditional methods. Note: this is only an estimated time based on previous service data and may vary depending on the case.',
          revenue: 'Average increase of <strong>200%</strong> in diagnostic revenue',
          conversion: 'Conversion rate of <strong>90%</strong> for additional services',
        },
        cta: 'Calculate Your Return Potential',
        recovery: {
          title: 'Our customers recover their investment in:',
          time: '3-6',
          months: 'months',
        },
        metrics: {
          service_value: 'Average value per diagnosis',
          monthly_diagnosis: 'Monthly diagnostics',
          additional_revenue: 'Additional revenue',
          disclaimer: 'Based on real data from partner workshops',
        },
      },
      
      // Recognition and approvals
      recognition: {
        title: 'Recognition & Approvals',
        description: 'RuidCar is recognized and approved by major automakers and has received endorsement from leading influencers in the automotive sector.',
        vw: {
          title: 'Approved by Volkswagen',
          description: 'Meets the manufacturer\'s quality standards',
        },
        experts: {
          title: 'Endorsed by Experts',
          description: 'Influencers with millions of followers recommend it',
        },
        cta: 'Talk to our team',
        partners: {
          title: 'Our Partners and Supporters',
          subtitle: 'Trusted by professionals and leading companies in the industry',
        },
      },
      
      // ROI Calculator
      calculator: {
        title: 'Return on Investment Calculator',
        subtitle: 'Calculate how much your workshop can earn with RuidCar',
        form: {
          services: {
            label: 'Monthly services',
            help: 'How many services does your workshop perform monthly?',
          },
          ticket: {
            label: 'Average ticket',
            help: 'What is the average value of a service?',
          },
          noise: {
            label: 'Noise problems (%)',
            help: 'Percentage of customers with noise problems',
          },
          diagnosis: {
            label: 'Diagnosis value',
            help: 'How much to charge for noise diagnosis',
          },
          calculate: 'Calculate Potential',
        },
        results: {
          title: 'Your Additional Revenue Potential',
          diagnosis: {
            title: 'Diagnostics/month',
            description: 'Noise diagnostics performed',
          },
          revenue: {
            title: 'Diagnosis revenue',
            description: 'Revenue from diagnostics',
          },
          services: {
            title: 'Additional services',
            description: 'Value of resulting services',
          },
          total: {
            title: 'Total additional revenue',
            description: 'Additional monthly revenue',
          },
          roi: {
            title: 'Estimated ROI',
            description: 'Return on investment',
          },
        },
      },
      
      // Contact form
      contact: {
        title: 'Transform Your Workshop Today',
        subtitle: 'Contact us to learn more about RuidCar and how it can revolutionize your business.',
        requestInfo: 'Request more information',
        form: {
          fullName: 'Full name',
          email: 'Email',
          whatsapp: 'WhatsApp',
          whatsappPlaceholder: 'Enter your WhatsApp number',
          searchCountry: 'Search country...',
          countryNotFound: 'Country not found',
          company: 'Company',
          businessType: 'Business type',
          businessTypePlaceholder: 'Select business type',
          businessTypes: {
            workshop: 'Auto Repair Shop',
            armoringShop: 'Armoring Shop',
            autoCenter: 'Auto Center',
            other: 'Other'
          },
          message: 'Message',
          sending: 'Sending...',
          submit: 'Send message',
          success: 'Message sent successfully!',
          error: 'Error sending message. Please try again.',
          address: 'Address',
        },
        contactInfo: 'Contact information',
        callToAction: 'Talk to our team',
        demoText: 'See RuidCar in action at your workshop. Schedule a technical visit with no commitment.',
        whatsappCTA: 'Chat on WhatsApp',
      },
      
      // Footer
      footer: {
        rights: 'All rights reserved.',
        product: 'RuidCar is a patented product.',
        privacy: 'Privacy Policy',
        terms: 'Terms of Use',
      },
      
      // Blog
      blog: {
        title: 'RuidCar Blog',
        subtitle: 'Tips, news and information about automotive noises',
        readMore: 'Read more',
        featured: 'Featured',
        recentPosts: 'Recent posts',
        searchPlaceholder: 'Search articles...',
        noResults: 'No results found',
        share: 'Share',
        tags: 'Tags',
        relatedPosts: 'Related posts',
        minutesToRead: 'min read',
        backToList: 'Back to list',
        notFound: 'Post not found',
      },
      
      // Landing page
      landing: {
        title: 'How can we help you today?',
        findWorkshop: 'I want to find a workshop',
        findWorkshopDescription: 'Find the nearest authorized workshop to you',
        moreInfo: 'I want more information about the equipment',
        moreInfoDescription: 'Learn more about RuidCar features and benefits',
      },
      
      // Premium landing page
      premium: {
        title: 'RuidCar Diagnostic Pro',
        subtitle: 'The ultimate automotive diagnostic solution that revolutionizes your workshop with precision and cutting-edge technology.',
        buy: 'Buy Now',
        locate: 'Find Nearby'
      },
      
      // Equipment customization
      customization: {
        title: 'RuidCar Customization',
        subtitle: 'Custom equipment for your business in various colors',
        options: 'Color options',
        description: 'RuidCar can be customized in your company color, creating a visual identity and making it a standout feature in your business.',
        benefits: 'Customization benefits',
        benefit1: 'Visual identity aligned with your brand',
        benefit2: 'Equipment stands out in your workshop',
        benefit3: 'High-quality and durable finish'
      },
    },
  },
  
  // Espanhol
  'es': {
    translation: {
      // Componentes de navegación
      nav: {
        home: 'Inicio',
        about: 'Acerca',
        features: 'Características',
        roi: 'Retorno',
        specs: 'Especificaciones',
        testimonials: 'Testimonios',
        contact: 'Contacto',
      },
      
      // Sección Hero
      hero: {
        title: 'RuidCar: La Tecnología Patentada que Duplica los Ingresos de su Taller',
        subtitle: 'Diagnósticos más precisos y un nuevo servicio altamente rentable para su taller',
        cta: {
          demo: 'Quiero Ganar Más',
          calculator: 'Calcule su Potencial de Ingresos',
        },
        results: {
          title: 'Resultados comprobados:',
          diagnose: {
            label: 'Diagnósticos en',
            value: '5-30 minutos*',
            comparison: 'vs. 2+ horas con métodos tradicionales',
          },
          revenue: {
            label: 'Aumento promedio de',
            value: '200%',
            description: 'en ingresos mensuales del taller',
          },
          conversion: {
            label: 'Tasa de conversión',
            value: '90%',
            description: 'de diagnósticos a servicios',
          },
        },
        watch_demo: 'Demostración Técnica de RuidCar',
      },
      
      // Demostración de video
      demo: {
        watch: 'Ver la Demostración',
        approved_by: 'Aprobado por',
        title: 'RuidCar - Tecnología Aprobada',
        description: 'Vea la demostración de RuidCar, el único equipo de diagnóstico de ruidos automotrices con tecnología patentada y aprobado por Volkswagen.',
      },

      // VSL (Video Sales Letter)
      vsl: {
        title: 'Descubra cómo RuidCar revoluciona los diagnósticos automotrices',
        watch: 'Vea el video de presentación',
        badges: {
          volkswagen: 'Aprobado por Volkswagen',
          workshops: '+200 talleres atendidos',
        },
      },
      
      // Sección de características
      features: {
        title: 'Características Exclusivas',
        subtitle: 'Tecnología patentada para diagnóstico de ruidos automotrices',
        items: {
          precision: {
            title: 'Precisión Incomparable',
            description: 'Identifica con exactitud el origen de los ruidos, eliminando suposiciones',
          },
          speed: {
            title: 'Diagnósticos Rápidos',
            description: 'Finalice diagnósticos en 5-30 minutos* que normalmente tomarían horas',
          },
          easy: {
            title: 'Fácil de Usar',
            description: 'Interfaz intuitiva que no requiere conocimientos técnicos avanzados',
          },
          reliable: {
            title: 'Resultados Más Confiables',
            description: 'Mayor precisión en los diagnósticos comparado con métodos tradicionales',
          },
          warranty: {
            title: '1 Año de Garantía',
            description: 'Soporte técnico y garantía total en el equipo',
          },
          training: {
            title: 'Capacitación Incluida',
            description: 'Formación completa para que su equipo utilice el equipo',
          },
        },
      },
      
      // Formulario de contacto
      contact: {
        title: 'Transforme Su Taller Hoy',
        subtitle: 'Contáctenos para saber más sobre RuidCar y cómo puede revolucionar su negocio.',
        requestInfo: 'Solicite más información',
        form: {
          fullName: 'Nombre completo',
          email: 'Correo electrónico',
          whatsapp: 'WhatsApp',
          whatsappPlaceholder: 'Introduzca su número de WhatsApp',
          searchCountry: 'Buscar país...',
          countryNotFound: 'País no encontrado',
          company: 'Empresa',
          businessType: 'Tipo de establecimiento',
          businessTypePlaceholder: 'Seleccione tipo de establecimiento',
          businessTypes: {
            workshop: 'Taller Mecánico',
            armoringShop: 'Empresa de Blindaje',
            autoCenter: 'Auto Center',
            other: 'Otro'
          },
          message: 'Mensaje',
          sending: 'Enviando...',
          submit: 'Enviar mensaje',
          success: '¡Mensaje enviado con éxito!',
          error: 'Error al enviar el mensaje. Inténtelo de nuevo.',
          address: 'Dirección',
        },
        contactInfo: 'Información de contacto',
        callToAction: 'Hablar con nuestro equipo',
        demoText: 'Vea RuidCar en acción en su taller. Programe una visita técnica sin compromiso.',
        whatsappCTA: 'Chatear por WhatsApp',
      },
      
      // Footer
      footer: {
        rights: 'Todos los derechos reservados.',
        product: 'RuidCar es un producto patentado.',
        privacy: 'Política de Privacidad',
        terms: 'Términos de Uso',
      },
      
      // Blog
      blog: {
        title: 'Blog RuidCar',
        subtitle: 'Consejos, novedades e información sobre ruidos automotrices',
        readMore: 'Leer más',
        featured: 'Destacado',
        recentPosts: 'Posts recientes',
        searchPlaceholder: 'Buscar artículos...',
        noResults: 'No se encontraron resultados',
        share: 'Compartir',
        tags: 'Etiquetas',
        relatedPosts: 'Posts relacionados',
        minutesToRead: 'min de lectura',
        backToList: 'Volver a la lista',
        notFound: 'Post no encontrado',
      },
      
      // Página de inicio
      landing: {
        title: '¿Cómo podemos ayudarte hoy?',
        findWorkshop: 'Quiero encontrar un taller',
        findWorkshopDescription: 'Encuentra el taller autorizado más cercano a ti',
        moreInfo: 'Quiero más información sobre el equipo',
        moreInfoDescription: 'Conoce más sobre las características y beneficios de RuidCar',
      },
      
      // Página premium de aterrizaje 
      premium: {
        title: 'RuidCar Diagnostic Pro',
        subtitle: 'La solución definitiva para diagnóstico automotriz que revoluciona tu taller con precisión y tecnología de vanguardia.',
        buy: 'Comprar',
        locate: 'Localizar'
      },
      
      // Personalización del equipo
      customization: {
        title: 'Personalización RuidCar',
        subtitle: 'Equipos personalizados para su empresa en diversos colores',
        options: 'Opciones de colores',
        description: 'El RuidCar puede ser personalizado con el color de su empresa, creando identidad visual y destacándose en su negocio.',
        continental: '* Modelos especiales como el "RuidCar Continental" están disponibles para socios seleccionados.',
        benefits: 'Beneficios de la personalización',
        benefit1: 'Identidad visual alineada con su marca',
        benefit2: 'Destaque del equipo en su taller',
        benefit3: 'Acabado de alta calidad y resistencia'
      }
    },
  },
};

// Função auxiliar para determinar o idioma baseado na localização
const determineLanguage = () => {
  // Verifica se está rodando em um ambiente com navigator disponível
  if (typeof window !== 'undefined' && window.navigator) {
    // Primeiro verifica se já tem idioma no localStorage
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang) {
      console.log('Usando idioma salvo do localStorage:', storedLang);
      return storedLang;
    }

    // Usa nossa biblioteca avançada de detecção de localização
    const locationInfo = detectUserLocation();
    console.log('Detecção avançada de localização:', locationInfo);

    // Determina o idioma com base nas informações detectadas
    if (locationInfo.fromBrazil) {
      console.log('Usuário detectado como brasileiro - definindo idioma pt-BR');
      return 'pt-BR';
    } else if (locationInfo.fromSpanishSpeaking) {
      console.log('Usuário detectado como falante de espanhol - definindo idioma es');
      return 'es';
    } else {
      console.log('Nenhuma localização específica detectada - usando inglês como padrão');
      return 'en-US';
    }
  }
  
  // Default para inglês se não for possível detectar
  return 'en-US';
};

// Evita inicialização múltipla em ambientes com HMR
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      resources,
      lng: determineLanguage(),
      fallbackLng: 'en-US',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'querystring', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupQuerystring: 'lng',
        lookupFromNavigatorLanguage: true,
        lookupFromPathIndex: 0,
        checkWhitelist: false,
        cookieExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
}

export default i18n;