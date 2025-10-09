# ERROS.md - Análise Completa de Erros Possíveis na Aplicação RuidCar

## =¨ **ERROS REACT #310 IDENTIFICADOS**

### **IDs de Erro Reportados:**
- `iu9rf1yqdka` - 09/10/2025, 13:48:05
- `z4um7lqvu4h` - 09/10/2025, 14:00:29
- `iwga3rwqzqn` - 09/10/2025, 14:07:20

### **Causa Raiz:**
O erro React #310 é um minified error que significa "hooks being called in wrong context" ou "hooks being called after component unmount".

## =Ë **COMPONENTES AFETADOS E CORREÇÕES APLICADAS**

###  **CORRIGIDOS:**

#### 1. **WorkshopModalMobile.tsx** 
- **Problema:** Hooks sendo chamados após desmontagem
- **Sintomas:** Crashes ao clicar em pinos de oficinas no mapa mobile
- **Correção:** Adicionado `isMounted` state + cleanup effects
- **Status:** Corrigido em commit `51344d6`

#### 2. **WorkshopSearch.tsx** 
- **Problema:** `setupABTest` sendo chamado no corpo do componente
- **Sintomas:** Erro ao usar busca inteligente
- **Correção:** Movido para `useEffect` + verificações de montagem
- **Status:** Corrigido em commit `bbe817c`

#### 3. **NearestWorkshopHero.tsx** 
- **Problema:** `trackConversion` sendo chamado sem verificações
- **Sintomas:** Crashes no componente hero mobile
- **Correção:** Verificações `isMounted` + try/catch
- **Status:** Corrigido em commit `bbe817c`

#### 4. **use-analytics.ts** 
- **Problema:** Hook não verificava se componente estava montado
- **Sintomas:** Analytics falhando após unmount
- **Correção:** `useRef` para tracking + verificações
- **Status:** Corrigido em commit `51344d6`

#### 5. **AdvancedAnalytics.ts** 
- **Problema:** Métodos chamados sem verificações de contexto
- **Sintomas:** Falhas em tracking de analytics
- **Correção:** Try/catch robusto + verificações `isTracking`
- **Status:** Corrigido em commit `51344d6`

#### 6. **use-user-analytics.ts** 
- **Problema:** Hooks sendo chamados após unmount em MapPage.tsx
- **Sintomas:** Crashes no sistema de analytics principal
- **Correção:** `isMounted` state + verificações em todos os métodos
- **Status:** Corrigido no commit atual

---

## = **ANÁLISE DETALHADA DE ERROS POSSÍVEIS**

### **1. ERROS REACT/JAVASCRIPT**

#### **React Hook Errors (Error #310, #321, #425)**
- **Causa:** Hooks chamados fora do contexto correto ou após unmount
- **Locais Críticos:**
  - Componentes com analytics (`useAnalytics`, `useUserAnalytics`)
  - Componentes com A/B testing (`setupABTest`)
  - Event handlers assíncronos (`setTimeout`, `Promise.then`)
  - Cleanup inadequado de effects
- **Prevenção:**
  -  Sempre usar `isMounted` state/ref
  -  Cleanup effects adequado
  -  Try/catch em hooks condicionais

#### **Memory Leaks**
- **Causa:** Event listeners não removidos, timeouts não cancelados
- **Locais Críticos:**
  - `AdvancedAnalytics.ts` - Performance Observer
  - `WorkshopModalMobile.tsx` - Spring animations
  - `MapPage.tsx` - Auto-geolocation timeouts
- **Prevenção:**
  -  `removeEventListener` em cleanup
  -  `clearTimeout` em cleanup
  -  `observer.disconnect()` em cleanup

#### **State Updates após Unmount**
- **Causa:** `setState` chamado após componente ser desmontado
- **Sintomas:** Warning "Can't perform a React state update on an unmounted component"
- **Prevenção:**
  -  Verificações `isMounted` antes de `setState`
  -  Cancelar requests em progress

### **2. ERROS DE GEOLOCALIZAÇÃO**

#### **GeolocationPositionError**
- **Código 1 (PERMISSION_DENIED):** Usuário negou acesso
- **Código 2 (POSITION_UNAVAILABLE):** Localização indisponível
- **Código 3 (TIMEOUT):** Timeout na obtenção da localização
- **Locais:** `MapPage.tsx`, `NearestWorkshopHero.tsx`, `use-immediate-location.ts`
- **Tratamento:**
  -  Fallback para IP geolocation
  -  Cache de localização
  -  UI state adequado

### **3. ERROS DE REDE**

#### **API Failures**
- **Endpoints Críticos:**
  - `/api/workshops` - Lista de oficinas
  - `/api/workshops/search` - Busca de oficinas
  - `/api/workshops/nearby` - Oficinas próximas
  - `/api/workshops/nearest-one` - Oficina mais próxima
- **Causas:**
  - Servidor offline
  - Rate limiting
  - Timeout de rede
  - Dados malformados
- **Tratamento:**
  -  Retry logic com backoff
  -  Cache para offline
  -  Graceful degradation

#### **CORS Errors**
- **Causa:** Requests para domínios externos sem CORS configurado
- **Locais:** Analytics externos, IP geolocation
- **Prevenção:** Proxy através do backend

### **4. ERROS DE AUTENTICAÇÃO**

#### **JWT Token Errors**
- **Token expirado:** Logout automático necessário
- **Token inválido:** Malformed ou corrupted
- **Token ausente:** Usuário não logado
- **Locais:** `use-auth.ts`, todas as páginas protegidas
- **Tratamento:**
  -  Refresh token automático
  -  Redirect para login
  -  Clear de dados locais

#### **Role Permission Errors**
- **Acesso negado:** Usuário sem permissão adequada
- **Role mismatch:** Role diferente do esperado
- **Prevenção:** Verificações no frontend + backend

### **5. ERROS DE DADOS**

#### **Database Errors**
- **Connection timeout:** DB indisponível
- **Query errors:** SQL malformado ou dados inválidos
- **Schema mismatch:** Estrutura de dados mudou
- **Prevenção:** Validation schemas + migration scripts

#### **Data Validation Errors**
- **Campos obrigatórios:** Dados ausentes
- **Formato inválido:** Email, telefone, CEP malformados
- **Tamanho inválido:** Strings muito longas ou curtas
- **Locais:** Formulários, APIs
- **Tratamento:** Validação client + server side

### **6. ERROS DE PERFORMANCE**

#### **Memory Leaks**
- **Causa:** Objetos não coletados pelo GC
- **Sintomas:** App fica lento com o tempo
- **Locais Críticos:**
  - Listeners de eventos globais
  - Timers não cancelados
  - Closures segurando referências

#### **Infinite Loops**
- **Causa:** useEffect sem dependências adequadas
- **Sintomas:** 100% CPU, app trava
- **Prevenção:** Dependency arrays corretos

### **7. ERROS DE COMPATIBILIDADE**

#### **Browser Compatibility**
- **APIs não suportadas:** Geolocation, Service Workers
- **CSS não suportado:** Grid, Flexbox em browsers antigos
- **JavaScript não suportado:** ES6+ features
- **Prevenção:** Feature detection + polyfills

#### **Mobile-Specific Errors**
- **Touch events:** Diferentes entre iOS/Android
- **Viewport issues:** Zoom, orientation changes
- **Performance:** Memória limitada
- **Prevenção:** Progressive enhancement

---

## =à **ESTRATÉGIAS DE PREVENÇÃO**

### **1. Error Boundaries**
```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error para analytics
    logErrorToService(error, errorInfo);
  }
}
```

### **2. Global Error Handling**
```javascript
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

### **3. Hook Safety Pattern**
```tsx
function useAnalyticsSafe() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const trackEvent = useCallback((data) => {
    if (!isMountedRef.current) return;
    // Safe to call analytics
  }, []);

  return { trackEvent };
}
```

### **4. Network Resilience**
```typescript
async function fetchWithRetry(url: string, options = {}, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries) throw error;
      await delay(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

---

## =Ê **MONITORAMENTO E ALERTAS**

### **Error Tracking Setup**
- **Sentry/LogRocket:** Para tracking de erros em produção
- **Custom Analytics:** Tracking de erros específicos do domínio
- **Performance Monitoring:** Core Web Vitals, loading times

### **Health Checks**
- **API Health:** Endpoints críticos funcionando
- **Database Health:** Queries executando normalmente
- **Authentication Health:** Login/logout funcionando

### **User Experience Monitoring**
- **Error Rate:** % de sessões com erro
- **Performance:** Tempos de carregamento
- **Conversion:** Funil de conversão funcionando

---

## =' **DEBUGGING TOOLS**

### **Development**
- **React DevTools:** State e props debugging
- **Redux DevTools:** State management debugging
- **Network Tab:** API calls e responses
- **Console Logs:** Structured logging

### **Production**
- **Source Maps:** Para unminify stack traces
- **Error Replay:** Tools como LogRocket para session replay
- **Performance Profiling:** Lighthouse, WebPageTest

---

## =Ý **CHECKLIST DE PREVENÇÃO**

### **Antes de cada Deploy:**
- [ ] Todos os hooks têm cleanup adequado
- [ ] Verificações `isMounted` em componentes críticos
- [ ] Error boundaries configurados
- [ ] Network error handling implementado
- [ ] Performance profiling executado
- [ ] Cross-browser testing realizado
- [ ] Mobile testing realizado

### **Código Review Checklist:**
- [ ] useEffect tem dependências corretas
- [ ] Event listeners são removidos em cleanup
- [ ] Timeouts são cancelados em cleanup
- [ ] Try/catch em operações assíncronas
- [ ] Validation em inputs de usuário
- [ ] Loading states implementados
- [ ] Error states implementados

---

## =€ **PLANO DE AÇÃO PARA ERROS FUTUROS**

### **1. Immediate Response (< 5 min)**
- Identificar se é crítico (quebra funcionalidade principal)
- Verificar se afeta todos os usuários ou subset
- Rollback se necessário

### **2. Investigation (< 30 min)**
- Reproduzir o erro localmente
- Analisar stack trace e logs
- Identificar causa raiz

### **3. Fix & Test (< 2 hours)**
- Implementar correção
- Testar em ambiente de staging
- Code review da correção

### **4. Deploy & Monitor (< 1 hour)**
- Deploy para produção
- Monitorar métricas por 24h
- Documentar a correção

---

## =È **MÉTRICAS DE SUCESSO**

### **Error Rate Targets:**
- **JavaScript Errors:** < 0.1% das sessões
- **API Errors:** < 0.5% das requests
- **Performance Errors:** < 1% das page loads

### **User Experience Targets:**
- **Time to Interactive:** < 3 segundos
- **Error Recovery:** < 10 segundos para retry
- **Offline Graceful Degradation:** 100% das features críticas

---

*Documento criado em: 09/10/2025*
*Última atualização: 09/10/2025*
*Versão: 1.0*