interface GeoData {
  ddd?: string;
  ddi?: string;
  estado?: string;
  cidade?: string;
  pais?: string;
  continente?: string;
  regiao?: string;
  timezone?: string;
  estadoCompleto?: string;
}

interface DDDInfo {
  estado: string;
  cidade: string;
  regiao: string;
  estadoCompleto: string;
}

interface DDIInfo {
  pais: string;
  continente: string;
  timezone?: string;
  idioma?: string;
}

export class GeoIntelligenceService {
  private static instance: GeoIntelligenceService;

  // Mapeamento completo de DDD para estado e cidade principal
  private readonly dddMap: Record<string, DDDInfo> = {
    '11': { estado: 'SP', cidade: 'São Paulo', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },
    '12': { estado: 'SP', cidade: 'São José dos Campos', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },
    '13': { estado: 'SP', cidade: 'Santos', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },
    '14': { estado: 'SP', cidade: 'Bauru', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },
    '15': { estado: 'SP', cidade: 'Sorocaba', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },
    '16': { estado: 'SP', cidade: 'Ribeirão Preto', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },
    '17': { estado: 'SP', cidade: 'São José do Rio Preto', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },
    '18': { estado: 'SP', cidade: 'Presidente Prudente', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },
    '19': { estado: 'SP', cidade: 'Campinas', regiao: 'Sudeste', estadoCompleto: 'São Paulo' },

    '21': { estado: 'RJ', cidade: 'Rio de Janeiro', regiao: 'Sudeste', estadoCompleto: 'Rio de Janeiro' },
    '22': { estado: 'RJ', cidade: 'Campos dos Goytacazes', regiao: 'Sudeste', estadoCompleto: 'Rio de Janeiro' },
    '24': { estado: 'RJ', cidade: 'Petrópolis', regiao: 'Sudeste', estadoCompleto: 'Rio de Janeiro' },

    '27': { estado: 'ES', cidade: 'Vitória', regiao: 'Sudeste', estadoCompleto: 'Espírito Santo' },
    '28': { estado: 'ES', cidade: 'Cachoeiro de Itapemirim', regiao: 'Sudeste', estadoCompleto: 'Espírito Santo' },

    '31': { estado: 'MG', cidade: 'Belo Horizonte', regiao: 'Sudeste', estadoCompleto: 'Minas Gerais' },
    '32': { estado: 'MG', cidade: 'Juiz de Fora', regiao: 'Sudeste', estadoCompleto: 'Minas Gerais' },
    '33': { estado: 'MG', cidade: 'Governador Valadares', regiao: 'Sudeste', estadoCompleto: 'Minas Gerais' },
    '34': { estado: 'MG', cidade: 'Uberlândia', regiao: 'Sudeste', estadoCompleto: 'Minas Gerais' },
    '35': { estado: 'MG', cidade: 'Poços de Caldas', regiao: 'Sudeste', estadoCompleto: 'Minas Gerais' },
    '37': { estado: 'MG', cidade: 'Divinópolis', regiao: 'Sudeste', estadoCompleto: 'Minas Gerais' },
    '38': { estado: 'MG', cidade: 'Montes Claros', regiao: 'Sudeste', estadoCompleto: 'Minas Gerais' },

    '41': { estado: 'PR', cidade: 'Curitiba', regiao: 'Sul', estadoCompleto: 'Paraná' },
    '42': { estado: 'PR', cidade: 'Ponta Grossa', regiao: 'Sul', estadoCompleto: 'Paraná' },
    '43': { estado: 'PR', cidade: 'Londrina', regiao: 'Sul', estadoCompleto: 'Paraná' },
    '44': { estado: 'PR', cidade: 'Maringá', regiao: 'Sul', estadoCompleto: 'Paraná' },
    '45': { estado: 'PR', cidade: 'Cascavel', regiao: 'Sul', estadoCompleto: 'Paraná' },
    '46': { estado: 'PR', cidade: 'Francisco Beltrão', regiao: 'Sul', estadoCompleto: 'Paraná' },

    '47': { estado: 'SC', cidade: 'Joinville', regiao: 'Sul', estadoCompleto: 'Santa Catarina' },
    '48': { estado: 'SC', cidade: 'Florianópolis', regiao: 'Sul', estadoCompleto: 'Santa Catarina' },
    '49': { estado: 'SC', cidade: 'Chapecó', regiao: 'Sul', estadoCompleto: 'Santa Catarina' },

    '51': { estado: 'RS', cidade: 'Porto Alegre', regiao: 'Sul', estadoCompleto: 'Rio Grande do Sul' },
    '53': { estado: 'RS', cidade: 'Pelotas', regiao: 'Sul', estadoCompleto: 'Rio Grande do Sul' },
    '54': { estado: 'RS', cidade: 'Caxias do Sul', regiao: 'Sul', estadoCompleto: 'Rio Grande do Sul' },
    '55': { estado: 'RS', cidade: 'Santa Maria', regiao: 'Sul', estadoCompleto: 'Rio Grande do Sul' },

    '61': { estado: 'DF', cidade: 'Brasília', regiao: 'Centro-Oeste', estadoCompleto: 'Distrito Federal' },
    '62': { estado: 'GO', cidade: 'Goiânia', regiao: 'Centro-Oeste', estadoCompleto: 'Goiás' },
    '63': { estado: 'TO', cidade: 'Palmas', regiao: 'Norte', estadoCompleto: 'Tocantins' },
    '64': { estado: 'GO', cidade: 'Rio Verde', regiao: 'Centro-Oeste', estadoCompleto: 'Goiás' },
    '65': { estado: 'MT', cidade: 'Cuiabá', regiao: 'Centro-Oeste', estadoCompleto: 'Mato Grosso' },
    '66': { estado: 'MT', cidade: 'Rondonópolis', regiao: 'Centro-Oeste', estadoCompleto: 'Mato Grosso' },
    '67': { estado: 'MS', cidade: 'Campo Grande', regiao: 'Centro-Oeste', estadoCompleto: 'Mato Grosso do Sul' },
    '68': { estado: 'AC', cidade: 'Rio Branco', regiao: 'Norte', estadoCompleto: 'Acre' },
    '69': { estado: 'RO', cidade: 'Porto Velho', regiao: 'Norte', estadoCompleto: 'Rondônia' },

    '71': { estado: 'BA', cidade: 'Salvador', regiao: 'Nordeste', estadoCompleto: 'Bahia' },
    '73': { estado: 'BA', cidade: 'Ilhéus', regiao: 'Nordeste', estadoCompleto: 'Bahia' },
    '74': { estado: 'BA', cidade: 'Juazeiro', regiao: 'Nordeste', estadoCompleto: 'Bahia' },
    '75': { estado: 'BA', cidade: 'Feira de Santana', regiao: 'Nordeste', estadoCompleto: 'Bahia' },
    '77': { estado: 'BA', cidade: 'Barreiras', regiao: 'Nordeste', estadoCompleto: 'Bahia' },

    '79': { estado: 'SE', cidade: 'Aracaju', regiao: 'Nordeste', estadoCompleto: 'Sergipe' },

    '81': { estado: 'PE', cidade: 'Recife', regiao: 'Nordeste', estadoCompleto: 'Pernambuco' },
    '82': { estado: 'AL', cidade: 'Maceió', regiao: 'Nordeste', estadoCompleto: 'Alagoas' },
    '83': { estado: 'PB', cidade: 'João Pessoa', regiao: 'Nordeste', estadoCompleto: 'Paraíba' },
    '84': { estado: 'RN', cidade: 'Natal', regiao: 'Nordeste', estadoCompleto: 'Rio Grande do Norte' },
    '85': { estado: 'CE', cidade: 'Fortaleza', regiao: 'Nordeste', estadoCompleto: 'Ceará' },
    '86': { estado: 'PI', cidade: 'Teresina', regiao: 'Nordeste', estadoCompleto: 'Piauí' },
    '87': { estado: 'PE', cidade: 'Petrolina', regiao: 'Nordeste', estadoCompleto: 'Pernambuco' },
    '88': { estado: 'CE', cidade: 'Juazeiro do Norte', regiao: 'Nordeste', estadoCompleto: 'Ceará' },
    '89': { estado: 'PI', cidade: 'Picos', regiao: 'Nordeste', estadoCompleto: 'Piauí' },

    '91': { estado: 'PA', cidade: 'Belém', regiao: 'Norte', estadoCompleto: 'Pará' },
    '92': { estado: 'AM', cidade: 'Manaus', regiao: 'Norte', estadoCompleto: 'Amazonas' },
    '93': { estado: 'PA', cidade: 'Santarém', regiao: 'Norte', estadoCompleto: 'Pará' },
    '94': { estado: 'PA', cidade: 'Marabá', regiao: 'Norte', estadoCompleto: 'Pará' },
    '95': { estado: 'RR', cidade: 'Boa Vista', regiao: 'Norte', estadoCompleto: 'Roraima' },
    '96': { estado: 'AP', cidade: 'Macapá', regiao: 'Norte', estadoCompleto: 'Amapá' },
    '97': { estado: 'AM', cidade: 'Coari', regiao: 'Norte', estadoCompleto: 'Amazonas' },
    '98': { estado: 'MA', cidade: 'São Luís', regiao: 'Nordeste', estadoCompleto: 'Maranhão' },
    '99': { estado: 'MA', cidade: 'Imperatriz', regiao: 'Nordeste', estadoCompleto: 'Maranhão' }
  };

  // Mapeamento de DDI para país
  private readonly ddiMap: Record<string, DDIInfo> = {
    '+1': { pais: 'Estados Unidos/Canadá', continente: 'América do Norte', timezone: 'UTC-5', idioma: 'Inglês' },
    '+7': { pais: 'Rússia', continente: 'Europa/Ásia', timezone: 'UTC+3', idioma: 'Russo' },
    '+20': { pais: 'Egito', continente: 'África', timezone: 'UTC+2', idioma: 'Árabe' },
    '+27': { pais: 'África do Sul', continente: 'África', timezone: 'UTC+2', idioma: 'Inglês' },
    '+30': { pais: 'Grécia', continente: 'Europa', timezone: 'UTC+2', idioma: 'Grego' },
    '+31': { pais: 'Países Baixos', continente: 'Europa', timezone: 'UTC+1', idioma: 'Holandês' },
    '+32': { pais: 'Bélgica', continente: 'Europa', timezone: 'UTC+1', idioma: 'Holandês/Francês' },
    '+33': { pais: 'França', continente: 'Europa', timezone: 'UTC+1', idioma: 'Francês' },
    '+34': { pais: 'Espanha', continente: 'Europa', timezone: 'UTC+1', idioma: 'Espanhol' },
    '+36': { pais: 'Hungria', continente: 'Europa', timezone: 'UTC+1', idioma: 'Húngaro' },
    '+39': { pais: 'Itália', continente: 'Europa', timezone: 'UTC+1', idioma: 'Italiano' },
    '+40': { pais: 'Romênia', continente: 'Europa', timezone: 'UTC+2', idioma: 'Romeno' },
    '+41': { pais: 'Suíça', continente: 'Europa', timezone: 'UTC+1', idioma: 'Alemão/Francês/Italiano' },
    '+43': { pais: 'Áustria', continente: 'Europa', timezone: 'UTC+1', idioma: 'Alemão' },
    '+44': { pais: 'Reino Unido', continente: 'Europa', timezone: 'UTC+0', idioma: 'Inglês' },
    '+45': { pais: 'Dinamarca', continente: 'Europa', timezone: 'UTC+1', idioma: 'Dinamarquês' },
    '+46': { pais: 'Suécia', continente: 'Europa', timezone: 'UTC+1', idioma: 'Sueco' },
    '+47': { pais: 'Noruega', continente: 'Europa', timezone: 'UTC+1', idioma: 'Norueguês' },
    '+48': { pais: 'Polônia', continente: 'Europa', timezone: 'UTC+1', idioma: 'Polonês' },
    '+49': { pais: 'Alemanha', continente: 'Europa', timezone: 'UTC+1', idioma: 'Alemão' },
    '+51': { pais: 'Peru', continente: 'América do Sul', timezone: 'UTC-5', idioma: 'Espanhol' },
    '+52': { pais: 'México', continente: 'América do Norte', timezone: 'UTC-6', idioma: 'Espanhol' },
    '+53': { pais: 'Cuba', continente: 'América Central', timezone: 'UTC-5', idioma: 'Espanhol' },
    '+54': { pais: 'Argentina', continente: 'América do Sul', timezone: 'UTC-3', idioma: 'Espanhol' },
    '+55': { pais: 'Brasil', continente: 'América do Sul', timezone: 'UTC-3', idioma: 'Português' },
    '+56': { pais: 'Chile', continente: 'América do Sul', timezone: 'UTC-3', idioma: 'Espanhol' },
    '+57': { pais: 'Colômbia', continente: 'América do Sul', timezone: 'UTC-5', idioma: 'Espanhol' },
    '+58': { pais: 'Venezuela', continente: 'América do Sul', timezone: 'UTC-4', idioma: 'Espanhol' },
    '+60': { pais: 'Malásia', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Malaio' },
    '+61': { pais: 'Austrália', continente: 'Oceania', timezone: 'UTC+10', idioma: 'Inglês' },
    '+62': { pais: 'Indonésia', continente: 'Ásia', timezone: 'UTC+7', idioma: 'Indonésio' },
    '+63': { pais: 'Filipinas', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Filipino/Inglês' },
    '+64': { pais: 'Nova Zelândia', continente: 'Oceania', timezone: 'UTC+12', idioma: 'Inglês' },
    '+65': { pais: 'Singapura', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Inglês/Malaio' },
    '+66': { pais: 'Tailândia', continente: 'Ásia', timezone: 'UTC+7', idioma: 'Tailandês' },
    '+81': { pais: 'Japão', continente: 'Ásia', timezone: 'UTC+9', idioma: 'Japonês' },
    '+82': { pais: 'Coreia do Sul', continente: 'Ásia', timezone: 'UTC+9', idioma: 'Coreano' },
    '+84': { pais: 'Vietnã', continente: 'Ásia', timezone: 'UTC+7', idioma: 'Vietnamita' },
    '+86': { pais: 'China', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Mandarim' },
    '+90': { pais: 'Turquia', continente: 'Europa/Ásia', timezone: 'UTC+3', idioma: 'Turco' },
    '+91': { pais: 'Índia', continente: 'Ásia', timezone: 'UTC+5:30', idioma: 'Hindi/Inglês' },
    '+92': { pais: 'Paquistão', continente: 'Ásia', timezone: 'UTC+5', idioma: 'Urdu/Inglês' },
    '+93': { pais: 'Afeganistão', continente: 'Ásia', timezone: 'UTC+4:30', idioma: 'Dari/Pashto' },
    '+94': { pais: 'Sri Lanka', continente: 'Ásia', timezone: 'UTC+5:30', idioma: 'Cingalês' },
    '+95': { pais: 'Myanmar', continente: 'Ásia', timezone: 'UTC+6:30', idioma: 'Birmanês' },
    '+98': { pais: 'Irã', continente: 'Ásia', timezone: 'UTC+3:30', idioma: 'Persa' },
    '+212': { pais: 'Marrocos', continente: 'África', timezone: 'UTC+1', idioma: 'Árabe/Francês' },
    '+213': { pais: 'Argélia', continente: 'África', timezone: 'UTC+1', idioma: 'Árabe/Francês' },
    '+216': { pais: 'Tunísia', continente: 'África', timezone: 'UTC+1', idioma: 'Árabe/Francês' },
    '+218': { pais: 'Líbia', continente: 'África', timezone: 'UTC+2', idioma: 'Árabe' },
    '+220': { pais: 'Gâmbia', continente: 'África', timezone: 'UTC+0', idioma: 'Inglês' },
    '+221': { pais: 'Senegal', continente: 'África', timezone: 'UTC+0', idioma: 'Francês' },
    '+224': { pais: 'Guiné', continente: 'África', timezone: 'UTC+0', idioma: 'Francês' },
    '+225': { pais: 'Costa do Marfim', continente: 'África', timezone: 'UTC+0', idioma: 'Francês' },
    '+226': { pais: 'Burkina Faso', continente: 'África', timezone: 'UTC+0', idioma: 'Francês' },
    '+227': { pais: 'Níger', continente: 'África', timezone: 'UTC+1', idioma: 'Francês' },
    '+228': { pais: 'Togo', continente: 'África', timezone: 'UTC+0', idioma: 'Francês' },
    '+229': { pais: 'Benin', continente: 'África', timezone: 'UTC+1', idioma: 'Francês' },
    '+230': { pais: 'Maurício', continente: 'África', timezone: 'UTC+4', idioma: 'Inglês/Francês' },
    '+231': { pais: 'Libéria', continente: 'África', timezone: 'UTC+0', idioma: 'Inglês' },
    '+232': { pais: 'Serra Leoa', continente: 'África', timezone: 'UTC+0', idioma: 'Inglês' },
    '+233': { pais: 'Gana', continente: 'África', timezone: 'UTC+0', idioma: 'Inglês' },
    '+234': { pais: 'Nigéria', continente: 'África', timezone: 'UTC+1', idioma: 'Inglês' },
    '+237': { pais: 'Camarões', continente: 'África', timezone: 'UTC+1', idioma: 'Francês/Inglês' },
    '+238': { pais: 'Cabo Verde', continente: 'África', timezone: 'UTC-1', idioma: 'Português' },
    '+239': { pais: 'São Tomé e Príncipe', continente: 'África', timezone: 'UTC+0', idioma: 'Português' },
    '+240': { pais: 'Guiné Equatorial', continente: 'África', timezone: 'UTC+1', idioma: 'Espanhol' },
    '+241': { pais: 'Gabão', continente: 'África', timezone: 'UTC+1', idioma: 'Francês' },
    '+242': { pais: 'República do Congo', continente: 'África', timezone: 'UTC+1', idioma: 'Francês' },
    '+243': { pais: 'República Democrática do Congo', continente: 'África', timezone: 'UTC+1', idioma: 'Francês' },
    '+244': { pais: 'Angola', continente: 'África', timezone: 'UTC+1', idioma: 'Português' },
    '+245': { pais: 'Guiné-Bissau', continente: 'África', timezone: 'UTC+0', idioma: 'Português' },
    '+249': { pais: 'Sudão', continente: 'África', timezone: 'UTC+2', idioma: 'Árabe' },
    '+250': { pais: 'Ruanda', continente: 'África', timezone: 'UTC+2', idioma: 'Francês/Inglês' },
    '+251': { pais: 'Etiópia', continente: 'África', timezone: 'UTC+3', idioma: 'Amárico' },
    '+252': { pais: 'Somália', continente: 'África', timezone: 'UTC+3', idioma: 'Somali' },
    '+254': { pais: 'Quênia', continente: 'África', timezone: 'UTC+3', idioma: 'Inglês/Suaíli' },
    '+255': { pais: 'Tanzânia', continente: 'África', timezone: 'UTC+3', idioma: 'Suaíli/Inglês' },
    '+256': { pais: 'Uganda', continente: 'África', timezone: 'UTC+3', idioma: 'Inglês' },
    '+257': { pais: 'Burundi', continente: 'África', timezone: 'UTC+2', idioma: 'Francês' },
    '+258': { pais: 'Moçambique', continente: 'África', timezone: 'UTC+2', idioma: 'Português' },
    '+260': { pais: 'Zâmbia', continente: 'África', timezone: 'UTC+2', idioma: 'Inglês' },
    '+261': { pais: 'Madagascar', continente: 'África', timezone: 'UTC+3', idioma: 'Francês/Malgaxe' },
    '+263': { pais: 'Zimbábue', continente: 'África', timezone: 'UTC+2', idioma: 'Inglês' },
    '+264': { pais: 'Namíbia', continente: 'África', timezone: 'UTC+2', idioma: 'Inglês' },
    '+265': { pais: 'Malawi', continente: 'África', timezone: 'UTC+2', idioma: 'Inglês' },
    '+266': { pais: 'Lesoto', continente: 'África', timezone: 'UTC+2', idioma: 'Inglês' },
    '+267': { pais: 'Botsuana', continente: 'África', timezone: 'UTC+2', idioma: 'Inglês' },
    '+268': { pais: 'Essuatíni', continente: 'África', timezone: 'UTC+2', idioma: 'Inglês' },
    '+269': { pais: 'Comores', continente: 'África', timezone: 'UTC+3', idioma: 'Árabe/Francês' },
    '+351': { pais: 'Portugal', continente: 'Europa', timezone: 'UTC+0', idioma: 'Português' },
    '+352': { pais: 'Luxemburgo', continente: 'Europa', timezone: 'UTC+1', idioma: 'Luxemburguês/Francês/Alemão' },
    '+353': { pais: 'Irlanda', continente: 'Europa', timezone: 'UTC+0', idioma: 'Inglês/Irlandês' },
    '+354': { pais: 'Islândia', continente: 'Europa', timezone: 'UTC+0', idioma: 'Islandês' },
    '+355': { pais: 'Albânia', continente: 'Europa', timezone: 'UTC+1', idioma: 'Albanês' },
    '+356': { pais: 'Malta', continente: 'Europa', timezone: 'UTC+1', idioma: 'Maltês/Inglês' },
    '+357': { pais: 'Chipre', continente: 'Europa', timezone: 'UTC+2', idioma: 'Grego/Turco' },
    '+358': { pais: 'Finlândia', continente: 'Europa', timezone: 'UTC+2', idioma: 'Finlandês/Sueco' },
    '+359': { pais: 'Bulgária', continente: 'Europa', timezone: 'UTC+2', idioma: 'Búlgaro' },
    '+370': { pais: 'Lituânia', continente: 'Europa', timezone: 'UTC+2', idioma: 'Lituano' },
    '+371': { pais: 'Letônia', continente: 'Europa', timezone: 'UTC+2', idioma: 'Letão' },
    '+372': { pais: 'Estônia', continente: 'Europa', timezone: 'UTC+2', idioma: 'Estoniano' },
    '+373': { pais: 'Moldávia', continente: 'Europa', timezone: 'UTC+2', idioma: 'Romeno' },
    '+374': { pais: 'Armênia', continente: 'Ásia', timezone: 'UTC+4', idioma: 'Armênio' },
    '+375': { pais: 'Bielorrússia', continente: 'Europa', timezone: 'UTC+3', idioma: 'Bielorrusso/Russo' },
    '+376': { pais: 'Andorra', continente: 'Europa', timezone: 'UTC+1', idioma: 'Catalão' },
    '+377': { pais: 'Mônaco', continente: 'Europa', timezone: 'UTC+1', idioma: 'Francês' },
    '+378': { pais: 'San Marino', continente: 'Europa', timezone: 'UTC+1', idioma: 'Italiano' },
    '+380': { pais: 'Ucrânia', continente: 'Europa', timezone: 'UTC+2', idioma: 'Ucraniano' },
    '+381': { pais: 'Sérvia', continente: 'Europa', timezone: 'UTC+1', idioma: 'Sérvio' },
    '+382': { pais: 'Montenegro', continente: 'Europa', timezone: 'UTC+1', idioma: 'Montenegrino' },
    '+383': { pais: 'Kosovo', continente: 'Europa', timezone: 'UTC+1', idioma: 'Albanês/Sérvio' },
    '+385': { pais: 'Croácia', continente: 'Europa', timezone: 'UTC+1', idioma: 'Croata' },
    '+386': { pais: 'Eslovênia', continente: 'Europa', timezone: 'UTC+1', idioma: 'Esloveno' },
    '+387': { pais: 'Bósnia e Herzegovina', continente: 'Europa', timezone: 'UTC+1', idioma: 'Bósnio/Croata/Sérvio' },
    '+389': { pais: 'Macedônia do Norte', continente: 'Europa', timezone: 'UTC+1', idioma: 'Macedônio' },
    '+420': { pais: 'República Tcheca', continente: 'Europa', timezone: 'UTC+1', idioma: 'Tcheco' },
    '+421': { pais: 'Eslováquia', continente: 'Europa', timezone: 'UTC+1', idioma: 'Eslovaco' },
    '+423': { pais: 'Liechtenstein', continente: 'Europa', timezone: 'UTC+1', idioma: 'Alemão' },
    '+500': { pais: 'Ilhas Malvinas', continente: 'América do Sul', timezone: 'UTC-3', idioma: 'Inglês' },
    '+501': { pais: 'Belize', continente: 'América Central', timezone: 'UTC-6', idioma: 'Inglês' },
    '+502': { pais: 'Guatemala', continente: 'América Central', timezone: 'UTC-6', idioma: 'Espanhol' },
    '+503': { pais: 'El Salvador', continente: 'América Central', timezone: 'UTC-6', idioma: 'Espanhol' },
    '+504': { pais: 'Honduras', continente: 'América Central', timezone: 'UTC-6', idioma: 'Espanhol' },
    '+505': { pais: 'Nicarágua', continente: 'América Central', timezone: 'UTC-6', idioma: 'Espanhol' },
    '+506': { pais: 'Costa Rica', continente: 'América Central', timezone: 'UTC-6', idioma: 'Espanhol' },
    '+507': { pais: 'Panamá', continente: 'América Central', timezone: 'UTC-5', idioma: 'Espanhol' },
    '+509': { pais: 'Haiti', continente: 'América Central', timezone: 'UTC-5', idioma: 'Francês/Crioulo' },
    '+590': { pais: 'Guadalupe', continente: 'América Central', timezone: 'UTC-4', idioma: 'Francês' },
    '+591': { pais: 'Bolívia', continente: 'América do Sul', timezone: 'UTC-4', idioma: 'Espanhol' },
    '+592': { pais: 'Guiana', continente: 'América do Sul', timezone: 'UTC-4', idioma: 'Inglês' },
    '+593': { pais: 'Equador', continente: 'América do Sul', timezone: 'UTC-5', idioma: 'Espanhol' },
    '+594': { pais: 'Guiana Francesa', continente: 'América do Sul', timezone: 'UTC-3', idioma: 'Francês' },
    '+595': { pais: 'Paraguai', continente: 'América do Sul', timezone: 'UTC-3', idioma: 'Espanhol/Guarani' },
    '+596': { pais: 'Martinica', continente: 'América Central', timezone: 'UTC-4', idioma: 'Francês' },
    '+597': { pais: 'Suriname', continente: 'América do Sul', timezone: 'UTC-3', idioma: 'Holandês' },
    '+598': { pais: 'Uruguai', continente: 'América do Sul', timezone: 'UTC-3', idioma: 'Espanhol' },
    '+599': { pais: 'Antilhas Holandesas', continente: 'América Central', timezone: 'UTC-4', idioma: 'Holandês' },
    '+670': { pais: 'Timor-Leste', continente: 'Ásia', timezone: 'UTC+9', idioma: 'Português/Tétum' },
    '+672': { pais: 'Ilha Norfolk', continente: 'Oceania', timezone: 'UTC+11', idioma: 'Inglês' },
    '+673': { pais: 'Brunei', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Malaio' },
    '+674': { pais: 'Nauru', continente: 'Oceania', timezone: 'UTC+12', idioma: 'Inglês' },
    '+675': { pais: 'Papua-Nova Guiné', continente: 'Oceania', timezone: 'UTC+10', idioma: 'Inglês' },
    '+676': { pais: 'Tonga', continente: 'Oceania', timezone: 'UTC+13', idioma: 'Inglês/Tonganês' },
    '+677': { pais: 'Ilhas Salomão', continente: 'Oceania', timezone: 'UTC+11', idioma: 'Inglês' },
    '+678': { pais: 'Vanuatu', continente: 'Oceania', timezone: 'UTC+11', idioma: 'Inglês/Francês' },
    '+679': { pais: 'Fiji', continente: 'Oceania', timezone: 'UTC+12', idioma: 'Inglês/Fijiano' },
    '+680': { pais: 'Palau', continente: 'Oceania', timezone: 'UTC+9', idioma: 'Inglês/Palauano' },
    '+681': { pais: 'Wallis e Futuna', continente: 'Oceania', timezone: 'UTC+12', idioma: 'Francês' },
    '+682': { pais: 'Ilhas Cook', continente: 'Oceania', timezone: 'UTC-10', idioma: 'Inglês' },
    '+683': { pais: 'Niue', continente: 'Oceania', timezone: 'UTC-11', idioma: 'Inglês' },
    '+684': { pais: 'Samoa Americana', continente: 'Oceania', timezone: 'UTC-11', idioma: 'Inglês' },
    '+685': { pais: 'Samoa', continente: 'Oceania', timezone: 'UTC+13', idioma: 'Inglês/Samoano' },
    '+686': { pais: 'Kiribati', continente: 'Oceania', timezone: 'UTC+12', idioma: 'Inglês' },
    '+687': { pais: 'Nova Caledônia', continente: 'Oceania', timezone: 'UTC+11', idioma: 'Francês' },
    '+688': { pais: 'Tuvalu', continente: 'Oceania', timezone: 'UTC+12', idioma: 'Inglês' },
    '+689': { pais: 'Polinésia Francesa', continente: 'Oceania', timezone: 'UTC-10', idioma: 'Francês' },
    '+690': { pais: 'Tokelau', continente: 'Oceania', timezone: 'UTC+13', idioma: 'Inglês' },
    '+691': { pais: 'Micronésia', continente: 'Oceania', timezone: 'UTC+11', idioma: 'Inglês' },
    '+692': { pais: 'Ilhas Marshall', continente: 'Oceania', timezone: 'UTC+12', idioma: 'Inglês' },
    '+850': { pais: 'Coreia do Norte', continente: 'Ásia', timezone: 'UTC+9', idioma: 'Coreano' },
    '+852': { pais: 'Hong Kong', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Cantonês/Inglês' },
    '+853': { pais: 'Macau', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Cantonês/Português' },
    '+855': { pais: 'Camboja', continente: 'Ásia', timezone: 'UTC+7', idioma: 'Khmer' },
    '+856': { pais: 'Laos', continente: 'Ásia', timezone: 'UTC+7', idioma: 'Lao' },
    '+880': { pais: 'Bangladesh', continente: 'Ásia', timezone: 'UTC+6', idioma: 'Bengali' },
    '+886': { pais: 'Taiwan', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Mandarim' },
    '+960': { pais: 'Maldivas', continente: 'Ásia', timezone: 'UTC+5', idioma: 'Divehi' },
    '+961': { pais: 'Líbano', continente: 'Ásia', timezone: 'UTC+2', idioma: 'Árabe' },
    '+962': { pais: 'Jordânia', continente: 'Ásia', timezone: 'UTC+2', idioma: 'Árabe' },
    '+963': { pais: 'Síria', continente: 'Ásia', timezone: 'UTC+2', idioma: 'Árabe' },
    '+964': { pais: 'Iraque', continente: 'Ásia', timezone: 'UTC+3', idioma: 'Árabe' },
    '+965': { pais: 'Kuwait', continente: 'Ásia', timezone: 'UTC+3', idioma: 'Árabe' },
    '+966': { pais: 'Arábia Saudita', continente: 'Ásia', timezone: 'UTC+3', idioma: 'Árabe' },
    '+967': { pais: 'Iêmen', continente: 'Ásia', timezone: 'UTC+3', idioma: 'Árabe' },
    '+968': { pais: 'Omã', continente: 'Ásia', timezone: 'UTC+4', idioma: 'Árabe' },
    '+970': { pais: 'Palestina', continente: 'Ásia', timezone: 'UTC+2', idioma: 'Árabe' },
    '+971': { pais: 'Emirados Árabes Unidos', continente: 'Ásia', timezone: 'UTC+4', idioma: 'Árabe' },
    '+972': { pais: 'Israel', continente: 'Ásia', timezone: 'UTC+2', idioma: 'Hebraico' },
    '+973': { pais: 'Bahrein', continente: 'Ásia', timezone: 'UTC+3', idioma: 'Árabe' },
    '+974': { pais: 'Catar', continente: 'Ásia', timezone: 'UTC+3', idioma: 'Árabe' },
    '+975': { pais: 'Butão', continente: 'Ásia', timezone: 'UTC+6', idioma: 'Dzongkha' },
    '+976': { pais: 'Mongólia', continente: 'Ásia', timezone: 'UTC+8', idioma: 'Mongol' },
    '+977': { pais: 'Nepal', continente: 'Ásia', timezone: 'UTC+5:45', idioma: 'Nepalês' },
    '+992': { pais: 'Tajiquistão', continente: 'Ásia', timezone: 'UTC+5', idioma: 'Tajique' },
    '+993': { pais: 'Turcomenistão', continente: 'Ásia', timezone: 'UTC+5', idioma: 'Turcomeno' },
    '+994': { pais: 'Azerbaijão', continente: 'Ásia', timezone: 'UTC+4', idioma: 'Azeri' },
    '+995': { pais: 'Geórgia', continente: 'Ásia', timezone: 'UTC+4', idioma: 'Georgiano' },
    '+996': { pais: 'Quirguistão', continente: 'Ásia', timezone: 'UTC+6', idioma: 'Quirguiz' },
    '+998': { pais: 'Uzbequistão', continente: 'Ásia', timezone: 'UTC+5', idioma: 'Uzbeque' }
  };

  private constructor() {}

  public static getInstance(): GeoIntelligenceService {
    if (!GeoIntelligenceService.instance) {
      GeoIntelligenceService.instance = new GeoIntelligenceService();
    }
    return GeoIntelligenceService.instance;
  }

  /**
   * Extrai dados geográficos a partir de um número de telefone
   */
  public extractGeoData(phone: string): GeoData {
    const cleanedPhone = this.cleanPhone(phone);
    const geoData: GeoData = {};

    // Verifica se é um número internacional
    if (cleanedPhone.startsWith('+')) {
      const ddiInfo = this.extractDDI(cleanedPhone);
      if (ddiInfo) {
        Object.assign(geoData, ddiInfo);
      }

      // Se for Brasil, também extrai o DDD
      if (cleanedPhone.startsWith('+55')) {
        const brazilPhone = cleanedPhone.substring(3);
        const dddInfo = this.extractDDD(brazilPhone);
        if (dddInfo) {
          Object.assign(geoData, dddInfo);
        }
      }
    } else {
      // Assume que é um número brasileiro
      const dddInfo = this.extractDDD(cleanedPhone);
      if (dddInfo) {
        Object.assign(geoData, dddInfo);
        geoData.pais = 'Brasil';
        geoData.continente = 'América do Sul';
      }
    }

    return geoData;
  }

  /**
   * Extrai o DDD de um número brasileiro
   */
  private extractDDD(phone: string): GeoData | null {
    // Remove caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');

    // Extrai o DDD (2 primeiros dígitos)
    const ddd = numbers.substring(0, 2);

    if (this.dddMap[ddd]) {
      const info = this.dddMap[ddd];
      return {
        ddd,
        estado: info.estado,
        cidade: info.cidade,
        regiao: info.regiao,
        estadoCompleto: info.estadoCompleto
      };
    }

    return null;
  }

  /**
   * Extrai o DDI de um número internacional
   */
  private extractDDI(phone: string): GeoData | null {
    // Tenta diferentes comprimentos de DDI (1 a 4 dígitos)
    for (let length = 4; length >= 1; length--) {
      const potentialDDI = phone.substring(0, length + 1); // +1 para incluir o '+'
      if (this.ddiMap[potentialDDI]) {
        const info = this.ddiMap[potentialDDI];
        return {
          ddi: potentialDDI,
          pais: info.pais,
          continente: info.continente,
          timezone: info.timezone
        };
      }
    }

    return null;
  }

  /**
   * Limpa o número de telefone removendo caracteres especiais
   */
  private cleanPhone(phone: string): string {
    // Mantém apenas números e o sinal de +
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Valida se é um número brasileiro válido
   */
  public validateBrazilianPhone(phone: string): boolean {
    const cleaned = this.cleanPhone(phone);
    const numbers = cleaned.replace(/\D/g, '');

    // Verifica se tem 10 ou 11 dígitos (com DDD)
    if (numbers.length !== 10 && numbers.length !== 11) {
      return false;
    }

    // Verifica se o DDD é válido
    const ddd = numbers.substring(0, 2);
    return !!this.dddMap[ddd];
  }

  /**
   * Formata um número de telefone brasileiro
   */
  public formatPhoneNumber(phone: string): string {
    const cleaned = this.cleanPhone(phone);
    const numbers = cleaned.replace(/\D/g, '');

    if (numbers.length === 11) {
      // Formato: (11) 91234-5678
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
    } else if (numbers.length === 10) {
      // Formato: (11) 1234-5678
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
    }

    return phone; // Retorna original se não puder formatar
  }

  /**
   * Obtém estatísticas de distribuição geográfica
   */
  public getGeographicDistribution(phones: string[]): {
    byState: Record<string, number>;
    byCountry: Record<string, number>;
    byRegion: Record<string, number>;
    byContinent: Record<string, number>;
  } {
    const distribution = {
      byState: {} as Record<string, number>,
      byCountry: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      byContinent: {} as Record<string, number>
    };

    for (const phone of phones) {
      const geoData = this.extractGeoData(phone);

      if (geoData.estado) {
        distribution.byState[geoData.estado] = (distribution.byState[geoData.estado] || 0) + 1;
      }

      if (geoData.pais) {
        distribution.byCountry[geoData.pais] = (distribution.byCountry[geoData.pais] || 0) + 1;
      }

      if (geoData.regiao) {
        distribution.byRegion[geoData.regiao] = (distribution.byRegion[geoData.regiao] || 0) + 1;
      }

      if (geoData.continente) {
        distribution.byContinent[geoData.continente] = (distribution.byContinent[geoData.continente] || 0) + 1;
      }
    }

    return distribution;
  }

  /**
   * Obtém a melhor hora para contato baseado no timezone
   */
  public getBestContactTime(timezone: string): {
    morning: { start: string; end: string };
    afternoon: { start: string; end: string };
    evening: { start: string; end: string };
  } {
    // Horários comerciais padrão ajustados para o timezone
    return {
      morning: { start: '09:00', end: '12:00' },
      afternoon: { start: '14:00', end: '17:00' },
      evening: { start: '17:00', end: '20:00' }
    };
  }

  /**
   * Obtém todos os DDDs de uma região específica
   */
  public getDDDsByRegion(region: string): string[] {
    return Object.keys(this.dddMap).filter(
      ddd => this.dddMap[ddd].regiao === region
    );
  }

  /**
   * Obtém todos os países de um continente específico
   */
  public getCountriesByContinent(continent: string): string[] {
    return Object.values(this.ddiMap)
      .filter(info => info.continente === continent)
      .map(info => info.pais);
  }
}

// Exporta uma instância única
export const geoIntelligence = GeoIntelligenceService.getInstance();