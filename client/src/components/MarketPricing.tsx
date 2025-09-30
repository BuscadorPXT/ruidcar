import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MarketPricing() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  
  const marketPrices = [
    {
      category: "Carros Linha Leve",
      description: "Hatch, Sedans Compactos",
      price: "R$ 250,00 - R$ 350,00",
      time: "5 minutos"
    },
    {
      category: "Carros Linha Média/Pesada",
      description: "Picapes, SUVs, Vans",
      price: "R$ 450,00 - R$ 600,00",
      time: "5 minutos"
    },
    {
      category: "Carros Importados/Premium",
      description: "BMW, Mercedes, Ferrari",
      price: "R$ 800,00 - R$ 1.200,00",
      time: "5 minutos"
    }
  ];

  return (
    <section id="pricing" className="py-16 bg-background dark:bg-slate-900" ref={sectionRef}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title dark:text-white">Preços de Mercado para Diagnósticos</h2>
          <p className="section-subtitle dark:text-gray-300">
            Saiba quanto as oficinas estão cobrando por diagnósticos mais precisos com tecnologia avançada.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="overflow-hidden rounded-xl shadow-lg border border-border"
        >
          <Table>
            <TableHeader className="bg-muted dark:bg-slate-800">
              <TableRow>
                <TableHead className="text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                  Categoria de Veículo
                </TableHead>
                <TableHead className="text-right text-sm font-semibold text-foreground uppercase tracking-wider">
                  Valor Médio
                </TableHead>
                <TableHead className="text-right text-sm font-semibold text-foreground uppercase tracking-wider">
                  Tempo de Diagnóstico
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketPrices.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-0">
                        <div className="text-sm font-medium text-foreground">{item.category}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-sm font-bold text-primary">
                    {item.price}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
                    {item.time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 p-6 bg-muted dark:bg-slate-800 rounded-lg"
        >
          <p className="text-muted-foreground italic">
            <span className="font-semibold dark:text-white">Nota:</span> <span className="font-bold">Os valores são baseados em pesquisas de mercado e podem variar de acordo com a região e o posicionamento do estabelecimento.</span> O diagnóstico com RuidCar é significativamente mais rápido e mais preciso que métodos tradicionais, o que justifica o valor premium cobrado pelo serviço.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
