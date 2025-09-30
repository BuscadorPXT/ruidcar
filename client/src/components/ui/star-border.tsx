import { cn } from "@/lib/utils"
import { ElementType, ComponentPropsWithoutRef, useState } from "react"
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react"

interface StarBorderProps<T extends ElementType> {
  as?: T
  color?: string
  speed?: string
  className?: string
  children: React.ReactNode
  variant?: "golden" | "gradient" | "premium" | "default"
}

export function StarBorder<T extends ElementType = "button">({
  as,
  className,
  color,
  speed = "12s",
  variant = "premium",
  children,
  ...props
}: StarBorderProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as || "button"
  const defaultColor = color || "hsl(var(--primary))" // Laranja padrão do site
  const [isHovered, setIsHovered] = useState(false);

  // Obter o estilo com base na variante
  const getVariantStyle = () => {
    switch (variant) {
      case "golden":
        return {
          container: cn(
            "relative inline-block py-[1px] overflow-hidden rounded-[20px]",
            "transition-all duration-300 ease-out hover:scale-[1.02]",
          ),
          inner: cn(
            "relative z-1 border text-center text-base font-medium rounded-[20px]",
            "bg-gradient-to-b from-amber-50 via-amber-200 to-amber-100",
            "text-amber-800 shadow-md py-4 px-8",
            "border-amber-400/30 hover:border-amber-500/50",
            "transition-all duration-300",
            "dark:from-slate-800 dark:via-amber-900/30 dark:to-slate-800 dark:text-amber-300"
          ),
          icon: <ChevronRight className="w-4 h-4 ml-2 inline-block transition-transform duration-300 transform group-hover:translate-x-1" />,
        };
      case "gradient":
        return {
          container: cn(
            "relative inline-block py-[1px] overflow-hidden rounded-[20px]",
            "transition-all duration-300 ease-out hover:scale-[1.02]",
            "group"
          ),
          inner: cn(
            "relative z-1 text-center text-base font-medium py-4 px-8 rounded-[20px]",
            "bg-gradient-to-r from-orange-500 to-orange-600",
            "text-white shadow-lg border border-orange-400/20",
            "transition-all duration-300 hover:shadow-md"
          ),
          icon: <ChevronRight className="w-4 h-4 ml-2 inline-block transition-transform duration-300 transform group-hover:translate-x-1" />,
        };
      case "premium":
        return {
          container: cn(
            "relative inline-block py-[1px] overflow-hidden rounded-[20px]",
            "transition-all duration-500 ease-out hover:scale-[1.02]",
            "group"
          ),
          inner: cn(
            "relative z-1 text-center text-base font-medium py-4 px-8 rounded-[20px]",
            "border shadow-lg",
            "bg-gradient-to-b from-white to-slate-100 text-orange-600",
            "dark:from-slate-800 dark:to-slate-900 dark:text-orange-400",
            "border-orange-400/30 dark:border-orange-500/20",
            "transition-all duration-300",
            "hover:border-orange-500/50 dark:hover:border-orange-400/40",
          ),
          overlay: cn(
            "absolute inset-0 -z-10 rounded-[20px] opacity-60",
            "bg-gradient-to-r from-orange-500/10 via-orange-400/10 to-orange-500/10"
          ),
          shine: cn(
            "absolute inset-0 w-full h-full",
            "before:absolute before:top-0 before:left-[-100%] before:z-[3] before:block",
            "before:w-1/2 before:h-full before:skew-x-[-25deg]",
            "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
            "group-hover:before:animate-slide-in overflow-hidden rounded-[20px]"
          ),
          icon: <ArrowRight className="w-4 h-4 ml-2 inline-block transition-transform duration-300 transform group-hover:translate-x-1" />,
        };
      default:
        return {
          container: cn(
            "relative inline-block py-[1px] overflow-hidden rounded-[20px]",
            "transition-all duration-300 ease-out"
          ),
          inner: cn(
            "relative z-1 border text-foreground text-center text-base py-4 px-6 rounded-[20px]",
            "bg-gradient-to-b from-slate-200 to-slate-300 border-orange-500/40",
            "dark:from-slate-800 dark:to-slate-900 dark:border-orange-400/50"
          ),
        };
    }
  };

  const style = getVariantStyle();

  return (
    <Component 
      className={cn(style.container, className)} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {variant === "default" && (
        <>
          <div
            className={cn(
              "absolute w-[300%] h-[50%] bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0",
              "opacity-40 dark:opacity-80" 
            )}
            style={{
              background: `radial-gradient(circle, ${defaultColor}, transparent 15%)`,
              animationDuration: speed,
            }}
          />
          <div
            className={cn(
              "absolute w-[300%] h-[50%] top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0",
              "opacity-40 dark:opacity-80"
            )}
            style={{
              background: `radial-gradient(circle, ${defaultColor}, transparent 15%)`,
              animationDuration: speed,
            }}
          />
        </>
      )}

      {variant === "premium" && (
        <>
          <div className={style.overlay}></div>
          <div className={style.shine}></div>
        </>
      )}

      <div className={style.inner}>
        <span className="flex items-center justify-center">
          {variant === "premium" && (
            <Sparkles className="w-4 h-4 mr-2 text-orange-500" />
          )}
          {children || "Quero Faturar Mais"}
          {style.icon}
        </span>
      </div>
    </Component>
  );
}