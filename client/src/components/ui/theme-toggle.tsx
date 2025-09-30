import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Função para alternar o tema
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Salva a preferência no localStorage
    localStorage.setItem("theme", newTheme);
    
    // Aplica ou remove a classe dark do documento
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Verificar tema atual ao montar o componente
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    
    // Tema claro é o padrão, só usar dark se explicitamente salvo como "dark"
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      // Se o tema não foi salvo ainda, definir como light por padrão
      if (!savedTheme) {
        localStorage.setItem("theme", "light");
      }
    }
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 rounded-md p-0"
      onClick={toggleTheme}
      title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">
        {theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      </span>
    </Button>
  );
}