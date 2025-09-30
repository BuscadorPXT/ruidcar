import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { calculateROI } from "@/lib/calculator";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ROICalculationResult {
  diagnosticsCount: number;
  diagnosisRevenue: number;
  additionalServicesRevenue: number;
  totalAdditionalRevenue: number;
  currentRevenue: number;
  totalNewRevenue: number;
  roiPeriod: string;
}

export default function RoiCalculator() {
  const [businessType, setBusinessType] = useState("officina");
  const [monthlyServices, setMonthlyServices] = useState(30);
  const [averageTicket, setAverageTicket] = useState(500);
  const [noisePercent, setNoisePercent] = useState(30);
  const [diagnosisValue, setDiagnosisValue] = useState(350);
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  
  const [results, setResults] = useState<ROICalculationResult>({
    diagnosticsCount: 0,
    diagnosisRevenue: 0,
    additionalServicesRevenue: 0,
    totalAdditionalRevenue: 0,
    currentRevenue: 0,
    totalNewRevenue: 0,
    roiPeriod: ""
  });

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const { toast } = useToast();

  // Mutation para salvar o cálculo no banco de dados
  const saveCalculationMutation = useMutation({
    mutationFn: async (data: {
      services: number;
      ticket: number;
      noisePercent: number;
      diagnosisValue: number;
      result: ROICalculationResult;
      email?: string;
    }) => {
      return apiRequest('/api/roi-calculator', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Cálculo salvo com sucesso!",
        description: "Enviamos os resultados para o seu email.",
        variant: "default",
      });
      setShowEmailInput(false);
      setEmail("");
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar cálculo",
        description: "Ocorreu um erro ao salvar seu cálculo. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error saving calculation:", error);
    },
  });

  // Função para salvar o cálculo
  const saveCalculation = () => {
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      saveCalculationMutation.mutate({
        services: monthlyServices,
        ticket: averageTicket,
        noisePercent,
        diagnosisValue,
        result: results,
        email
      });
    } else if (showEmailInput) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido para receber os resultados.",
        variant: "destructive",
      });
    } else {
      setShowEmailInput(true);
    }
  };

  useEffect(() => {
    const result = calculateROI({
      services: monthlyServices,
      ticket: averageTicket,
      noisePercent,
      diagnosisValue
    });
    setResults(result);
  }, [monthlyServices, averageTicket, noisePercent, diagnosisValue]);

  const chartData = [
    {
      name: 'Faturamento Atual',
      value: results.currentRevenue,
      fill: 'hsl(var(--secondary))'
    },
    {
      name: 'Faturamento com RuidCar',
      value: results.totalNewRevenue,
      fill: 'hsl(var(--primary))'
    }
  ];

  return (
    <section id="calculator" className="py-20 bg-gradient-to-b from-background to-muted dark:from-slate-900 dark:to-slate-800" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full filter blur-3xl opacity-70"></div>
        <div className="absolute top-1/2 -right-10 w-32 h-32 bg-primary/10 rounded-full filter blur-2xl opacity-50"></div>
        
        <motion.div 
          className="text-center mb-16 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-2 bg-primary/10 text-primary font-medium rounded-full px-4 py-1 text-sm">
            ROI Estimado
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Calculadora de Retorno</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra o potencial de faturamento adicional que o RuidCar pode trazer para o seu negócio.
          </p>
        </motion.div>
        
        <Card className="bg-card rounded-2xl shadow-xl overflow-hidden border-0">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* Inputs section */}
              <div className="p-8 lg:col-span-2 border-b lg:border-b-0 lg:border-r border-border bg-gradient-to-br from-card to-muted/50 dark:from-slate-800 dark:to-slate-900/50">
                <h3 className="text-2xl font-semibold text-primary mb-8 flex items-center">
                  <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-primary/10 text-primary mr-3 text-lg">1</span>
                  Dados do seu negócio
                </h3>
                
                <form className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="business-type" className="text-base font-medium">Tipo de estabelecimento</Label>
                      <Select
                        value={businessType}
                        onValueChange={setBusinessType}
                      >
                        <SelectTrigger id="business-type" className="mt-2 border-gray-300 shadow-sm h-12">
                          <SelectValue placeholder="Tipo de estabelecimento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="officina">Oficina Mecânica</SelectItem>
                          <SelectItem value="blindadora">Blindadora</SelectItem>
                          <SelectItem value="auto-center">Auto Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="monthly-services" className="text-base font-medium">Atendimentos mensais</Label>
                      <Input
                        id="monthly-services"
                        type="number"
                        min={1}
                        value={monthlyServices}
                        onChange={(e) => setMonthlyServices(parseInt(e.target.value) || 1)}
                        className="mt-2 border-gray-300 shadow-sm h-12"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="average-ticket" className="text-base font-medium">Ticket médio atual (R$)</Label>
                      <Input
                        id="average-ticket"
                        type="number"
                        min={1}
                        value={averageTicket}
                        onChange={(e) => setAverageTicket(parseInt(e.target.value) || 1)}
                        className="mt-2 border-gray-300 shadow-sm h-12"
                      />
                    </div>
                    
                    <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="noise-percent" className="text-base font-medium">% de clientes com problemas de ruído</Label>
                        <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">{noisePercent}%</span>
                      </div>
                      <input
                        id="noise-percent"
                        type="range"
                        min={10}
                        max={50}
                        value={noisePercent}
                        onChange={(e) => setNoisePercent(parseInt(e.target.value))}
                        className="mt-2 block w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>10%</span>
                        <span>30%</span>
                        <span>50%</span>
                      </div>
                    </div>
                    
                    <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="diagnosis-value" className="text-base font-medium">Valor médio do diagnóstico (R$)</Label>
                        <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">R$ {diagnosisValue}</span>
                      </div>
                      <input
                        id="diagnosis-value"
                        type="range"
                        min={200}
                        max={700}
                        step={50}
                        value={diagnosisValue}
                        onChange={(e) => setDiagnosisValue(parseInt(e.target.value))}
                        className="mt-2 block w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>R$ 200</span>
                        <span>R$ 450</span>
                        <span>R$ 700</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Results section */}
              <div className="p-8 lg:col-span-3 bg-card dark:bg-slate-800">
                <h3 className="text-2xl font-semibold text-primary mb-8 flex items-center">
                  <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-primary/10 text-primary mr-3 text-lg">2</span>
                  Seu potencial de receita
                </h3>
                
                {/* Results cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900 p-5 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800 flex flex-col">
                    <p className="text-sm text-blue-800/80 dark:text-blue-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-70"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Diagnósticos mensais
                    </p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-auto">
                      {results.diagnosticsCount}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900 p-5 rounded-xl shadow-sm border border-green-100 dark:border-green-800 flex flex-col">
                    <p className="text-sm text-green-800/80 dark:text-green-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-70"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      Receita diagnósticos
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-300 mt-auto">
                      {`R$ ${results.diagnosisRevenue.toLocaleString('pt-BR')}`}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900 p-5 rounded-xl shadow-sm border border-purple-100 dark:border-purple-800 flex flex-col">
                    <p className="text-sm text-purple-800/80 dark:text-purple-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-70"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      Serviços adicionais
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-300 mt-auto">
                      {`R$ ${results.additionalServicesRevenue.toLocaleString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                
                {/* Chart and ROI period */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-card dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-border">
                    <h4 className="text-lg font-semibold text-card-foreground mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
                      Comparativo de faturamento
                    </h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#555', fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => 
                              `R$ ${(value / 1000).toFixed(0)}k`
                            }
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#777', fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => 
                              [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']
                            } 
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[4, 4, 0, 0]}
                            maxBarSize={80}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* ROI Card - Totalmente redesenhado */}
                  <div className="bg-card dark:bg-slate-900 rounded-lg shadow-md p-0 overflow-hidden">
                    <div className="w-full h-0.5 bg-gradient-to-r from-orange-500 to-green-500"></div>
                    
                    <div className="px-2 py-2">
                      {/* Título principal simplificado */}
                      <div className="border-b border-border pb-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                          <p className="text-xs font-semibold text-card-foreground">Retorno do Investimento</p>
                        </div>
                      </div>
                      
                      {/* Valores em formato grid mais compacto */}
                      <div className="mb-2.5 grid grid-cols-2 gap-2">
                        <div className="bg-card dark:bg-slate-900">
                          <p className="text-[9px] text-muted-foreground mb-0.5">Faturamento adicional</p>
                          <p className="text-lg font-bold text-orange-500">
                            R$ {Math.floor(results.totalAdditionalRevenue / 1000) > 0 
                              ? Math.floor(results.totalAdditionalRevenue / 1000) + "k" 
                              : results.totalAdditionalRevenue.toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                          </p>
                          <p className="text-[9px] text-muted-foreground">mensal</p>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-950 rounded pl-2 py-1">
                          <p className="text-[9px] text-muted-foreground mb-0.5">ROI estimado</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {results.roiPeriod.replace(' meses', '')}
                          </p>
                          <p className="text-[9px] text-muted-foreground">meses</p>
                        </div>
                      </div>
                      
                      {/* Aumento de faturamento como tag separada */}
                      <div className="flex items-start gap-1.5 mb-2.5">
                        <p className="text-[9px] text-muted-foreground pt-0.5">
                          Aumento no faturamento:
                        </p>
                        <span className="bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[9px] px-1.5 py-0.5 rounded inline-block">
                          +{Math.round((results.totalNewRevenue / results.currentRevenue - 1) * 100)}%
                        </span>
                      </div>
                      
                      {/* Email input ou botões */}
                      {showEmailInput ? (
                        <div className="bg-muted dark:bg-slate-950 rounded p-2 mb-1">
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu-email@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-6 text-xs mb-1.5"
                          />
                          <div className="grid grid-cols-2 gap-1.5">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowEmailInput(false)}
                              disabled={saveCalculationMutation.isPending}
                              className="h-6 text-[10px] px-1"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              onClick={saveCalculation}
                              disabled={saveCalculationMutation.isPending}
                              className="bg-orange-500 h-6 text-[10px] px-1"
                            >
                              {saveCalculationMutation.isPending ? "Enviando..." : "Enviar"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button 
                            className="w-full h-7 text-[10px] font-medium bg-orange-500 hover:bg-orange-600 mb-1.5"
                            onClick={saveCalculation}
                          >
                            Receber resultados por email
                          </Button>
                          
                          <Button 
                            className="w-full h-7 text-[10px] font-medium bg-card border border-orange-500 text-orange-500 dark:border-orange-400 dark:text-orange-400" 
                            asChild
                          >
                            <a href="/home#contact">
                              Falar com consultor
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}