# REACT ERROR #310 - MAPEAMENTO COMPLETO E CORREÇÕES DEFINITIVAS

## 🚨 **SITUAÇÃO CRÍTICA IDENTIFICADA**

### **Novos Erros Detectados:**
- `q9y5ttgc91p` - 03/11/2025, 14:07:06 - ✅ CORRIGIDO (WorkshopMap.tsx)
- `m5zifbw48a` - 03/11/2025, 14:27:46 - ✅ CORRIGIDO (WorkshopMapMobile.tsx)
- `3quk6ghi934` - 03/11/2025, 14:33:04 - ❌ **ATIVO** (Múltiplos componentes)

### **Status:** 🔴 **CRÍTICO** - Múltiplos componentes violando Rules of Hooks

---

## 📋 **MAPEAMENTO COMPLETO DOS PROBLEMAS**

### **🎯 COMPONENTES CRÍTICOS IDENTIFICADOS (4 BOMBAS RELÓGIO)**

#### **1. BookingModal.tsx**
**Localização:** `/client/src/components/BookingModal.tsx`
**Severidade:** 🔴 **CRÍTICA**

```tsx
// PROBLEMA: Hooks declarados nas linhas 94-118
export default function BookingModal({ isOpen, onClose, workshop }) {
  const [step, setStep] = useState(1);                    // ❌ HOOK 1
  const [loading, setLoading] = useState(false);          // ❌ HOOK 2
  const [checkingAvailability, setCheckingAvailability] = useState(false); // ❌ HOOK 3
  const [pricing, setPricing] = useState([]);             // ❌ HOOK 4
  const [availableSlots, setAvailableSlots] = useState([]); // ❌ HOOK 5
  const [selectedDate, setSelectedDate] = useState('');   // ❌ HOOK 6
  const [bookingData, setBookingData] = useState({...});  // ❌ HOOK 7
  const [errors, setErrors] = useState({});               // ❌ HOOK 8
  const { toast } = useToast();                           // ❌ HOOK 9

  // ... mais código ...

  if (!workshop) return null; // ❌ EARLY RETURN APÓS HOOKS (linha 356)
```

**Problema:** Quando `workshop` é `null`, o componente faz early return, mas na próxima renderização com `workshop` válido, o React tenta chamar 9+ hooks, causando inconsistência.

#### **2. WorkshopModal.tsx**
**Localização:** `/client/src/components/WorkshopModal.tsx`
**Severidade:** 🔴 **CRÍTICA**

```tsx
// PROBLEMA: Hooks declarados nas linhas 23-33
export default function WorkshopModal({ workshop, open, onClose }) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false); // ❌ HOOK 1
  const [diagnosticStatus, setDiagnosticStatus] = useState(null);  // ❌ HOOK 2
  const [loadingDiagnosticStatus, setLoadingDiagnosticStatus] = useState(false); // ❌ HOOK 3
  const { toast } = useToast();                                    // ❌ HOOK 4

  useEffect(() => { /* ... */ }, [workshop, open]);               // ❌ HOOK 5

  // ... mais código ...

  if (!workshop) return null; // ❌ EARLY RETURN APÓS HOOKS (linha 67)
```

#### **3. WorkshopModalMobile.tsx**
**Localização:** `/client/src/components/WorkshopModalMobile.tsx`
**Severidade:** 🔴 **CRÍTICA**

```tsx
// PROBLEMA: Hooks declarados nas linhas 17-31
export default function WorkshopModalMobile({ workshop, open, onClose, source = 'map' }) {
  const [isAnimating, setIsAnimating] = useState(false);    // ❌ HOOK 1
  const [swipeAction, setSwipeAction] = useState(null);     // ❌ HOOK 2
  const [isMounted, setIsMounted] = useState(true);         // ❌ HOOK 3
  const { trackConversion } = useAnalytics();               // ❌ HOOK 4

  const [{ x, scale, backgroundColor }, api] = useSpring(/* ... */); // ❌ HOOK 5

  useEffect(() => { /* ... */ }, [/* ... */]);             // ❌ HOOK 6

  // ... mais código ...

  if (!workshop) return null; // ❌ EARLY RETURN APÓS HOOKS (linha 84)
```

#### **4. OnboardingTour.tsx**
**Localização:** `/client/src/components/OnboardingTour.tsx`
**Severidade:** 🔴 **CRÍTICA**

```tsx
// PROBLEMA: Hooks declarados nas linhas 10-13
export default function OnboardingTour({ steps, isOpen, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);       // ❌ HOOK 1
  const [targetRect, setTargetRect] = useState(null);      // ❌ HOOK 2
  const overlayRef = useRef(null);                         // ❌ HOOK 3

  useEffect(() => { /* ... */ }, [isOpen]);               // ❌ HOOK 4
  // ... mais useEffect ...

  // ... mais código ...

  if (!isOpen || !steps[currentStep]) return null; // ❌ EARLY RETURN APÓS HOOKS (linha 224)
```

---

## 🔍 **ANÁLISE TÉCNICA DAS VIOLAÇÕES**

### **React Rules of Hooks Violadas:**

1. **Rule #1:** "Only Call Hooks at the Top Level"
   - ❌ Todos os 4 componentes declaram hooks ANTES de early returns condicionais
   - ❌ Isso causa inconsistência no número de hooks entre renders

2. **Rule #2:** "Only Call Hooks from React Functions"
   - ✅ Respeitada (todos são function components)

3. **Rule #3:** "Call Hooks in the Same Order Every Time"
   - ❌ VIOLADA: Quando early return acontece, nenhum hook é chamado, mas em render posterior, todos são chamados

### **Cenários de Trigger do Erro:**

#### **BookingModal.tsx:**
```
Render 1: workshop = null → early return → 0 hooks chamados
Render 2: workshop = {...} → hooks chamados → 9+ hooks chamados
❌ React Error #310: "Rendered more hooks than during the previous render"
```

#### **WorkshopModal.tsx:**
```
Render 1: workshop = null → early return → 0 hooks chamados
Render 2: workshop = {...} → hooks chamados → 5+ hooks chamados
❌ React Error #310
```

#### **OnboardingTour.tsx:**
```
Render 1: isOpen = false → early return → 0 hooks chamados
Render 2: isOpen = true → hooks chamados → 4+ hooks chamados
❌ React Error #310
```

---

## 💡 **SOLUÇÕES DEFINITIVAS**

### **🔧 PADRÃO DE CORREÇÃO OBRIGATÓRIO**

Para TODOS os componentes problemáticos, aplicar este padrão:

```tsx
export default function ProblematicComponent({ requiredProp }) {
  // ✅ 1. SEMPRE declarar hooks primeiro (ordem consistente)
  const [state1, setState1] = useState(defaultValue);
  const [state2, setState2] = useState(defaultValue);
  const customHook = useCustomHook();

  // ✅ 2. Early return SOMENTE depois de TODOS os hooks
  if (!requiredProp) {
    return (
      <div className="component-loading">
        <p>Loading...</p>
      </div>
    );
  }

  // ✅ 3. Resto da lógica do componente
  return (
    <div>
      {/* component JSX */}
    </div>
  );
}
```

### **🛠️ IMPLEMENTAÇÃO DAS CORREÇÕES**

#### **1. BookingModal.tsx - CORREÇÃO OBRIGATÓRIA:**
```tsx
export default function BookingModal({ isOpen, onClose, workshop }) {
  // ✅ TODOS os hooks SEMPRE no topo
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [pricing, setPricing] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingData, setBookingData] = useState({
    workshopId: workshop?.id || 0, // ✅ Safe access
    // ... resto do estado
  });
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  // ✅ useEffect com workshop como dependência (não problema)
  useEffect(() => {
    if (isOpen && workshop) {
      setStep(1);
      // ... reset logic
    }
  }, [isOpen, workshop]);

  // ✅ Early return APÓS todos os hooks
  if (!workshop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center p-6">
            <p>Carregando informações da oficina...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ✅ Resto do componente
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* JSX normal */}
    </Dialog>
  );
}
```

#### **2. Mesmo padrão para WorkshopModal.tsx, WorkshopModalMobile.tsx, OnboardingTour.tsx**

---

## 🚨 **OUTROS RISCOS IDENTIFICADOS NO CODEBASE**

### **⚠️ PADRÕES DE RISCO ENCONTRADOS:**

#### **1. Renderização Condicional de Componentes com Hooks:**
```tsx
// ❌ RISCO: Se condition mudar, hooks podem ser inconsistentes
{condition && <ComponentWithHooks />}

// ✅ SEGURO: Sempre renderizar, controlar internamente
<ComponentWithHooks enabled={condition} />
```

#### **2. Early Returns Problemáticos:**
Busca encontrou vários casos potenciais:
- `BookingModal.tsx:343` - `if (!price) return null;` (em função, OK)
- `BookingModal.tsx:356` - `if (!workshop) return null;` ❌ CRÍTICO
- `WorkshopModal.tsx:67` - `if (!workshop) return null;` ❌ CRÍTICO
- `WorkshopModalMobile.tsx:84` - `if (!workshop) return null;` ❌ CRÍTICO
- `OnboardingTour.tsx:224` - `if (!isOpen || !steps[currentStep]) return null;` ❌ CRÍTICO

#### **3. Componentes de Alto Risco (para monitorar):**
- `NearestWorkshopHero.tsx` - ✅ JÁ CORRIGIDO (tem `isMounted` pattern)
- `WorkshopSearch.tsx` - ⚠️ VERIFICAR (componente complexo)
- `NotificationBell.tsx` - ⚠️ VERIFICAR (polling, pode ter unmount issues)

---

## 📊 **MÉTRICAS DE IMPACTO**

### **Componentes Afetados:**
- 🔴 **4 componentes críticos** com early returns após hooks
- ⚠️ **30+ componentes** usando hooks (monitorar)
- ✅ **2 componentes já corrigidos** (WorkshopMap, WorkshopMapMobile)

### **Cenários de Trigger:**
1. **BookingModal:** Abrir modal sem workshop selecionado
2. **WorkshopModal:** Render com workshop null/undefined
3. **WorkshopModalMobile:** Mesmo caso mobile
4. **OnboardingTour:** Toggle do onboarding tour

### **Frequência Estimada:**
- 🔴 **ALTA** - Modais são abertos frequentemente no mobile
- 🔴 **CRÍTICA** - Erro `3quk6ghi934` confirma alta incidência

---

## 🛡️ **PLANO DE CORREÇÃO EMERGENCIAL**

### **Fase 1 - CRÍTICA (HOJE):**
1. ✅ Corrigir BookingModal.tsx (early return após hooks)
2. ✅ Corrigir WorkshopModal.tsx (early return após hooks)
3. ✅ Corrigir WorkshopModalMobile.tsx (early return após hooks)
4. ✅ Corrigir OnboardingTour.tsx (early return após hooks)
5. ✅ Deploy e teste imediato

### **Fase 2 - PREVENTIVA (Esta semana):**
1. 🔍 Audit completo de todos os componentes com hooks
2. 🛠️ Implementar ESLint rule para early returns após hooks
3. 📊 Setup monitoring específico para Error #310
4. 📚 Documentação de boas práticas

### **Fase 3 - SISTÊMICA (Próxima semana):**
1. 🧪 Testes automatizados para Rules of Hooks
2. 🔄 CI/CD hooks para verificação automática
3. 📈 Dashboard de saúde dos hooks
4. 👥 Treinamento da equipe

---

## 🚀 **IMPLEMENTAÇÃO IMEDIATA**

### **Ordem de Prioridade:**
1. **BookingModal.tsx** - Mais complexo, mais hooks
2. **WorkshopModalMobile.tsx** - Mobile crítico
3. **WorkshopModal.tsx** - Desktop modal
4. **OnboardingTour.tsx** - Menos crítico mas importante

### **Testing Strategy:**
```bash
# Testes manuais obrigatórios após correção:
1. Abrir mapa → clicar em oficina sem selecionar
2. Tentar agendar diagnóstico sem oficina
3. Toggle onboarding tour rapidamente
4. Testar em mobile e desktop
```

---

## 📞 **MONITORAMENTO CONTÍNUO**

### **Alertas Configurar:**
- ✅ Error tracking para React Error #310
- ✅ Performance monitoring de hooks
- ✅ Mobile crash reporting
- ✅ Component render tracking

### **KPIs de Sucesso:**
- ✅ **Zero erros #310** por 48h consecutivas
- ✅ **< 0.01%** error rate geral
- ✅ **100% uptime** dos modais críticos
- ✅ **< 2s** load time dos componentes

---

## ⚠️ **ALERTAS CRÍTICOS**

### **❌ NUNCA FAZER:**
- ❌ Early returns após declaração de hooks
- ❌ Hooks condicionais (dentro de if/for)
- ❌ Hooks em callbacks ou funções aninhadas
- ❌ Ignorar warnings do React DevTools

### **✅ SEMPRE FAZER:**
- ✅ Hooks sempre no topo dos componentes
- ✅ Early returns ANTES ou APÓS todos os hooks
- ✅ useEffect com dependências corretas
- ✅ Cleanup de effects e listeners

---

**📅 Documento criado:** 03/11/2025
**👤 Autor:** Claude Code Analysis
**🔄 Versão:** 1.0 - Mapeamento Completo
**📋 Status:** IMPLEMENTAÇÃO URGENTE NECESSÁRIA

---

*Este documento mapeia TODOS os problemas identificados no codebase que causam React Error #310. A implementação destas correções é CRÍTICA para estabilidade da aplicação.*