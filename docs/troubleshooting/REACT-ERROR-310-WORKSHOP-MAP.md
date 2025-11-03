# REACT ERROR #310 - WORKSHOP MAP MOBILE ANALYSIS

## 🚨 **NOVO ERRO IDENTIFICADO**

### **ID do Erro:** `q9y5ttgc91p`
### **Timestamp:** 03/11/2025, 14:07:06
### **Localização:** `/mapa` (mobile)
### **Ação:** Usuário seleciona estado e clica no pino de localização da oficina

---

## 📋 **RESUMO EXECUTIVO**

**Tipo:** React Error #310 - "Rendered more hooks than during the previous render"
**Severidade:** 🔴 ALTA - Quebra funcionalidade principal do mapa mobile
**Afetados:** Usuários mobile na página de mapa
**Status:** 🔍 EM INVESTIGAÇÃO

---

## 🔍 **ANÁLISE TÉCNICA DETALHADA**

### **O que é React Error #310?**
O React Error #310 ocorre quando há inconsistência no número de hooks chamados entre diferentes renders do mesmo componente. Isso é considerado uma violação das "Rules of Hooks" do React.

### **Possíveis Causas Identificadas no WorkshopMap.tsx:**

#### 1. **🎯 RENDERIZAÇÃO CONDICIONAL DE COMPONENTES COM HOOKS**
**Localização:** `WorkshopMap.tsx:268-340`
```tsx
{!isMapReady ? (
  <div>Loading...</div>
) : (
  <MapContainer>
    <MapEventHandler onZoomChange={setZoomLevel} />
    {(center[0] !== -15.7801 || center[1] !== -47.9292) && (
      <MapCenterController center={center} searchRadius={searchRadius} />
    )}
    {workshops.length > 0 && !hasUserLocation && (
      <FitBoundsController workshops={workshops} />
    )}
  </MapContainer>
)}
```

**Problema:**
- `MapEventHandler`, `MapCenterController`, e `FitBoundsController` são renderizados condicionalmente
- Cada um destes componentes usa `useEffect` e `useMap`
- Em mobile, mudanças rápidas de estado podem causar renders inconsistentes

#### 2. **🔄 MÚLTIPLOS useEffect COM DEPENDÊNCIAS COMPLEXAS**
**Localização:** `WorkshopMap.tsx:199-249`
```tsx
// Effect 1: Sync prop user location (linha 199)
useEffect(() => {
  if (propUserLocation && isMounted) {
    setUserLocation(propUserLocation);
  }
}, [propUserLocation, isMounted]);

// Effect 2: Check container ready (linha 206)
useEffect(() => {
  const checkContainer = () => {
    if (containerRef.current && isMounted) {
      setIsMapReady(true);
    }
  };
  // ...
}, [isMounted]);

// Effect 3: Get user location (linha 226)
useEffect(() => {
  if (!propUserLocation && navigator.geolocation && isMounted) {
    navigator.geolocation.getCurrentPosition(/* ... */);
  }
}, [propUserLocation, isMounted]);

// Effect 4: Cleanup (linha 245)
useEffect(() => {
  return () => {
    setIsMounted(false);
  };
}, []);
```

**Problema:**
- 4 useEffect diferentes com dependências que podem mudar em ordens diferentes
- `isMounted` sendo usado como dependência pode causar cascata de re-renders
- Em mobile, lifecycle pode ser diferente (background/foreground)

#### 3. **🧮 HOOK useWorkshopClustering COM DEPENDÊNCIAS DINÂMICAS**
**Localização:** `WorkshopMap.tsx:172-177`
```tsx
const { clusters } = useWorkshopClustering(workshops, {
  enabled: enableClustering,
  zoomLevel: zoomLevel,
  clusterDistance: 0.08,
  minClusterSize: 3
});
```

**Problema:**
- `zoomLevel` é atualizado via `MapEventHandler`
- `workshops` pode mudar quando usuário seleciona estado
- `useMemo` interno pode não estar sendo consistente entre renders

#### 4. **📱 PROBLEMAS ESPECÍFICOS DO MOBILE**

**Touch vs Click Events:**
- Em mobile, `click` no pino pode trigger diferentes eventos
- `onWorkshopClick` pode ser chamado múltiplas vezes rapidamente
- Isso pode causar state updates durante renders

**Lifecycle Mobile:**
- Apps mobile podem entrar em background/foreground
- `navigator.geolocation` pode comportar-se diferentemente
- Timing de eventos pode ser diferente

#### 5. **🗺️ COMPONENTES LEAFLET COM HOOKS**
**MapEventHandler:** `WorkshopMap.tsx:98-122`
```tsx
function MapEventHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap(); // ⚠️ Hook do react-leaflet
  const isMountedRef = useRef(true);

  useEffect(() => {
    const handleZoom = () => {
      if (isMountedRef.current) {
        onZoomChange(map.getZoom()); // ⚠️ Pode causar re-render do pai
      }
    };
    map.on('zoomend', handleZoom);
    // ...
  }, [map, onZoomChange]);
}
```

**Problema:**
- `useMap()` pode retornar valores diferentes entre renders
- `onZoomChange` trigger re-render do componente pai
- Isso pode causar inconsistência na ordem dos hooks

---

## 🎯 **CENÁRIO DE REPRODUÇÃO**

### **Sequência de Eventos:**
1. Usuário acessa `/mapa` no mobile
2. Seleciona um estado (filters workshops)
3. Mapa re-renderiza com novos workshops
4. `useWorkshopClustering` recalcula clusters
5. Usuário clica rapidamente no pino de uma oficina
6. `onWorkshopClick` é chamado
7. **ERRO:** Hooks são renderizados em ordem diferente

### **Condições Específicas Mobile:**
- Touch events podem ser mais rápidos que clicks
- Viewport pode mudar durante interação
- Background/foreground pode afetar lifecycle
- Memory constraints podem afetar timing

---

## 💡 **SOLUÇÕES PROPOSTAS**

### **🔧 SOLUÇÃO 1: HOOK SAFETY PATTERN (IMEDIATA)**
**Prioridade:** 🔴 ALTA
**Tempo estimado:** 2 horas

Implementar padrão de segurança já usado em outros componentes:

```tsx
export default function WorkshopMap(props) {
  const isMountedRef = useRef(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Garantir ordem consistente de hooks
  useEffect(() => {
    setIsInitialized(true);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Early return APÓS todos os hooks
  if (!isInitialized) {
    return <LoadingComponent />;
  }

  // Resto do componente...
}
```

### **🔧 SOLUÇÃO 2: COMPONENTIZAÇÃO DOS CONTROLLERS (MÉDIA)**
**Prioridade:** 🟡 MÉDIA
**Tempo estimado:** 4 horas

Remover renderização condicional dos controllers:

```tsx
// Sempre renderizar, mas com lógica interna
<MapContainer>
  <MapEventHandler
    onZoomChange={setZoomLevel}
    enabled={true}
  />
  <MapCenterController
    center={center}
    searchRadius={searchRadius}
    enabled={shouldCenter}
  />
  <FitBoundsController
    workshops={workshops}
    enabled={shouldFitBounds}
  />
</MapContainer>
```

### **🔧 SOLUÇÃO 3: DEBOUNCE MOBILE INTERACTIONS (LONGO PRAZO)**
**Prioridade:** 🟢 BAIXA
**Tempo estimado:** 6 horas

Implementar debounce específico para mobile:

```tsx
const debouncedWorkshopClick = useMemo(
  () => debounce((workshop: Workshop) => {
    if (!isMountedRef.current) return;
    onWorkshopClick(workshop);
  }, 300),
  [onWorkshopClick]
);
```

---

## 🛠️ **IMPLEMENTAÇÃO RECOMENDADA**

### **Fase 1: Fix Crítico (hoje)**
1. ✅ Implementar `isMountedRef` pattern
2. ✅ Remover renderização condicional de components com hooks
3. ✅ Adicionar try/catch em event handlers
4. ✅ Testar em mobile

### **Fase 2: Fortalecimento (esta semana)**
1. 📊 Implementar logging específico para mobile
2. 🔄 Refatorar controllers para serem sempre renderizados
3. 📱 Adicionar debounce para touch events
4. ✅ Testes automatizados mobile

### **Fase 3: Monitoramento (próxima semana)**
1. 📈 Setup analytics para tracking do erro
2. 🚨 Alertas proativos para Error #310
3. 📊 Dashboard de saúde do mapa mobile

---

## 📊 **MÉTRICAS DE SUCESSO**

### **KPIs de Correção:**
- ✅ **Zero erros #310** na página `/mapa` mobile
- ✅ **< 2s** tempo de carregamento do mapa mobile
- ✅ **> 95%** taxa de sucesso em cliques de pinos
- ✅ **< 0.1%** taxa de erro geral na página mapa

### **Monitoramento:**
- Error tracking por device type
- Performance metrics mobile vs desktop
- User interaction success rates
- Geographic distribution of errors

---

## 🔗 **ARQUIVOS RELACIONADOS**

### **Componentes Principais:**
- `/client/src/components/WorkshopMap.tsx` - Componente principal
- `/client/src/components/ClusterMarker.tsx` - Markers de clusters
- `/client/src/hooks/use-workshop-clustering.ts` - Hook de clustering

### **Páginas Afetadas:**
- `/client/src/pages/MapPage.tsx` - Página principal do mapa
- `/client/src/pages/WorkshopSearch.tsx` - Busca com mapa

### **Hooks Relacionados:**
- `/client/src/hooks/use-analytics.ts` - Analytics hook
- `/client/src/hooks/use-auth.ts` - Authentication hook
- `/client/src/hooks/use-immediate-location.ts` - Geolocation hook

---

## 📝 **PRÓXIMOS PASSOS**

### **Ação Imediata (hoje):**
1. 🔧 Implementar hook safety pattern no WorkshopMap.tsx
2. 🧪 Testar fix em ambiente mobile
3. 📊 Deploy e monitorar por 24h

### **Ação Curto Prazo (esta semana):**
1. 🔄 Refatorar controllers para renderização não-condicional
2. 📱 Adicionar logging específico mobile
3. 🛡️ Implementar error boundary específico para mapa

### **Ação Longo Prazo (próximas 2 semanas):**
1. 📈 Setup monitoramento avançado
2. 🧪 Testes automatizados mobile
3. 📚 Documentação de debugging mobile

---

## ⚠️ **ALERTAS DE PREVENÇÃO**

### **❌ NÃO FAZER:**
- Não adicionar mais useEffect condicionais
- Não usar early returns após hooks já declarados
- Não ignorar warnings do React em desenvolvimento
- Não assumir que mobile comporta igual a desktop

### **✅ SEMPRE FAZER:**
- Sempre usar isMountedRef pattern em componentes críticos
- Sempre testar em mobile real após mudanças
- Sempre implementar error boundaries
- Sempre logging de erros para analytics

---

## 📞 **CONTATO DE EMERGÊNCIA**

**Para erros críticos do Error #310:**
1. 🚨 Verificar console do browser (F12)
2. 📱 Testar em mobile real (não emulador)
3. 🔄 Revisar recent commits em WorkshopMap.tsx
4. 💾 Rollback se necessário

---

*Documento criado em: 03/11/2025*
*Autor: Claude Code Analysis*
*Versão: 1.0*
*Próxima revisão: 04/11/2025*