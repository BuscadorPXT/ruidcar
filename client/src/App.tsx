import { Router, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Suspense, useEffect, lazy } from "react";
import "./i18n";
import "./styles/accessibility.css";
import "./styles/safari-fixes.css";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initIPGeoLocation } from './lib/ipGeoLocation';
import { initWebVitalsMonitoring } from './lib/webVitals';
import { globalErrorHandler } from './services/GlobalErrorHandler';
import SkipLink from "@/components/SkipLink";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  AdminRoute,
  OficinaRoute,
  ClienteRoute,
  AuthenticatedRoute,
  MultiRoleRoute
} from "@/components/ProtectedRoute";

// Lazy load all pages for code splitting
const Home = lazy(() => import("@/pages/Home"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const PremiumLanding = lazy(() => import("@/pages/PremiumLanding"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const AgendarPage = lazy(() => import("@/pages/AgendarPage"));
const IcaraPage = lazy(() => import("@/pages/IcaraPage"));
const UnifiedLogin = lazy(() => import("@/pages/UnifiedLogin"));
const AdminLoginRedirect = lazy(() => import("@/pages/AdminLoginRedirect"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminWorkshops = lazy(() => import("@/pages/AdminWorkshops"));
const AdminPendingWorkshops = lazy(() => import("@/pages/AdminPendingWorkshops"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const LeadManagement = lazy(() => import("@/pages/admin/LeadManagement"));
const LeadDashboard = lazy(() => import("@/pages/admin/LeadDashboard"));
const LeadIntelligence = lazy(() => import("@/pages/admin/LeadIntelligence"));
const WhatsAppManager = lazy(() => import("@/pages/admin/WhatsAppManager"));
const WorkshopRegister = lazy(() => import("@/pages/WorkshopRegister"));
const WorkshopDashboard = lazy(() => import("@/pages/WorkshopDashboard"));
const WorkshopAppointments = lazy(() => import("@/pages/WorkshopAppointments"));
const WorkshopProfile = lazy(() => import("@/pages/WorkshopProfile"));
const WorkshopServices = lazy(() => import("@/pages/WorkshopServices"));
const DiagnosticConfig = lazy(() => import("@/pages/workshop/DiagnosticConfig"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-neutral-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      <p className="mt-4 text-gray-600">Carregando...</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    console.log('🎯 Inicializando aplicação...');

    // Inicializar Global Error Handler primeiro
    globalErrorHandler.initialize();

    // Usa apenas o sistema de IP geolocalização melhorado
    initIPGeoLocation();

    // Inicializa monitoramento de Web Vitals
    initWebVitalsMonitoring((data) => {
      console.log('📊 Web Vitals Report:', data);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SkipLink href="#main-content">Pular para o conteúdo principal</SkipLink>
          <SkipLink href="#navigation">Pular para a navegação</SkipLink>
          <SkipLink href="#contact">Pular para o contato</SkipLink>
          <Router>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <div id="main-content" tabIndex={-1}>
                  <Switch>
                <Route path="/" component={PremiumLanding} />
                <Route path="/home" component={Home} />
                <Route path="/landing" component={LandingPage} />
                <Route path="/blog" component={BlogPage} />
                <Route path="/blog/:slug" component={BlogPostPage} />
                <Route path="/mapa" component={MapPage} />
                <Route path="/agendar" component={AgendarPage} />
                <Route path="/icara" component={IcaraPage} />

                {/* Login Unificado para todos os usuários */}
                <Route path="/login" component={UnifiedLogin} />

                {/* Redirecionamentos para login unificado com intent */}
                <Route path="/admin/login" component={AdminLoginRedirect} />
                <Route path="/workshop/login">
                  {() => {
                    window.location.href = '/login';
                    return null;
                  }}
                </Route>

                {/* Painéis Administrativos - Requer role ADMIN */}
                <Route path="/admin/leads/dashboard">
                  <AdminRoute>
                    <LeadDashboard />
                  </AdminRoute>
                </Route>
                <Route path="/admin/leads">
                  <AdminRoute>
                    <LeadManagement />
                  </AdminRoute>
                </Route>
                <Route path="/admin/leads-intelligence">
                  <AdminRoute>
                    <LeadIntelligence />
                  </AdminRoute>
                </Route>
                <Route path="/admin/whatsapp">
                  <AdminRoute>
                    <WhatsAppManager />
                  </AdminRoute>
                </Route>
                <Route path="/admin/users">
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                </Route>
                <Route path="/admin/workshops/pending">
                  <AdminRoute>
                    <AdminPendingWorkshops />
                  </AdminRoute>
                </Route>
                <Route path="/admin/workshops">
                  <AdminRoute>
                    <AdminWorkshops />
                  </AdminRoute>
                </Route>
                <Route path="/admin">
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                </Route>

                {/* Painéis de Oficina - Requer role OFICINA_OWNER */}
                <Route path="/workshop/dashboard">
                  <OficinaRoute organizationScoped={false}>
                    <WorkshopDashboard />
                  </OficinaRoute>
                </Route>
                <Route path="/workshop/appointments">
                  <OficinaRoute organizationScoped={false}>
                    <WorkshopAppointments />
                  </OficinaRoute>
                </Route>
                <Route path="/workshop/profile">
                  <OficinaRoute organizationScoped={false}>
                    <WorkshopProfile />
                  </OficinaRoute>
                </Route>
                <Route path="/workshop/services">
                  <OficinaRoute organizationScoped={false}>
                    <WorkshopServices />
                  </OficinaRoute>
                </Route>
                <Route path="/workshop/diagnostic">
                  <OficinaRoute organizationScoped={false}>
                    <DiagnosticConfig />
                  </OficinaRoute>
                </Route>
                <Route path="/workshop">
                  <OficinaRoute organizationScoped={false}>
                    <WorkshopDashboard />
                  </OficinaRoute>
                </Route>

                {/* Rotas por Organização - Requer acesso à organização específica */}
                <Route path="/oficina/:id">
                  {() => (
                    <OficinaRoute organizationScoped={true}>
                      <WorkshopDashboard />
                    </OficinaRoute>
                  )}
                </Route>

                {/* Registro de Oficina - Público mas com funcionalidades opcionais para autenticados */}
                <Route path="/workshop/register" component={WorkshopRegister} />

                {/* Área do Cliente - Requer role CLIENTE */}
                <Route path="/cliente">
                  <ClienteRoute>
                    <ClientDashboard />
                  </ClienteRoute>
                </Route>

                {/* Rota protegida multi-role para exemplo */}
                <Route path="/dashboard">
                  <MultiRoleRoute allowedRoles={['ADMIN', 'OFICINA_OWNER']}>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                          Dashboard Geral
                        </h1>
                        <p className="text-gray-600">
                          Acesso para admins e donos de oficina
                        </p>
                      </div>
                    </div>
                  </MultiRoleRoute>
                </Route>
                <Route component={NotFound} />
              </Switch>
            </div>
          </Suspense>
        </ErrorBoundary>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
}

export default App;