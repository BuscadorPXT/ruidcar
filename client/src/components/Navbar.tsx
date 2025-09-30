import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background shadow-md z-50" role="navigation" aria-label="Navegação principal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex-shrink-0 flex items-center" aria-label="RuidCar - Página inicial">
                <span className="text-2xl font-bold"><span className="text-primary">RUID</span><span className="text-foreground">CAR</span><span className="text-foreground text-sm align-super">®</span></span>
              </a>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <NavLinks className="text-foreground hover:text-primary font-medium transition-colors" />
            <Button asChild>
              <a
                href="#contact"
                aria-label="Ir para seção de contato"
                onClick={(e) => {
                  e.preventDefault();
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {t('nav.contact')}
              </a>
            </Button>
            <div className="ml-2 flex items-center space-x-3">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          <div className="flex md:hidden items-center">
            <button
              type="button"
              className="text-foreground hover:text-primary"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-background border-t border-border"
          role="menu"
          aria-label="Menu de navegação mobile"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3" role="menuitem">
            <a href="#calculator" className="block px-3 py-2 text-foreground hover:bg-accent rounded-md" aria-label="Ir para calculadora de ROI">
              Calculadora de ROI
            </a>

            {/* Grupo Recursos (Mobile) */}
            <div className="border-t border-border pt-2">
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('nav.features')}
              </div>
              <a href="#pricing" className="block px-4 py-2 text-foreground hover:bg-accent rounded-md ml-2" aria-label="Ir para seção de recursos">
                {t('nav.features')}
              </a>
              <a href="#specifications" className="block px-4 py-2 text-foreground hover:bg-accent rounded-md ml-2" aria-label="Ir para especificações técnicas">
                {t('nav.specs')}
              </a>
            </div>

            {/* Grupo Credibilidade (Mobile) */}
            <div className="border-t border-border pt-2">
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Credibilidade
              </div>
              <a href="#testimonials-gallery" className="block px-4 py-2 text-foreground hover:bg-accent rounded-md ml-2" aria-label="Ver depoimentos de clientes">
                {t('nav.testimonials')}
              </a>
              <a href="#influencers" className="block px-4 py-2 text-foreground hover:bg-accent rounded-md ml-2" aria-label="Ver reconhecimento de influenciadores">
                {t('recognition.title')}
              </a>
            </div>

            <a href="#success" className="block px-3 py-2 text-foreground hover:bg-accent rounded-md" aria-label="Ver casos de sucesso">
              {t('roi.title')}
            </a>

            <Link href="/blog">
              <a className="block px-3 py-2 text-foreground hover:bg-accent rounded-md" aria-label="Ir para o blog">
                Blog
              </a>
            </Link>

            <Link href="/map">
              <a className="block px-3 py-2 text-foreground hover:bg-accent rounded-md" aria-label="Ver mapa interativo">
                {t('nav.about')}
              </a>
            </Link>

            <a
              href="#contact"
              className="block px-3 py-2 bg-primary text-primary-foreground rounded-md"
              aria-label="Ir para formulário de contato"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                setTimeout(() => {
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
            >
              {t('nav.contact')}
            </a>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4 px-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('nav.preferences', 'Preferências')}
                </span>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

interface NavLinksProps {
  className?: string;
}

function NavLinks({ className }: NavLinksProps) {
  const { t } = useTranslation();

  return (
    <>
      <a href="#calculator" className={className} aria-label="Ir para calculadora de ROI">
        Calculadora de ROI
      </a>

      {/* Menu Recursos agrupado */}
      <DropdownMenu>
        <DropdownMenuTrigger className={`flex items-center gap-1 ${className}`} aria-label="Menu de recursos">
          {t('nav.features')}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="navbar-dropdown">
          <DropdownMenuItem asChild>
            <a href="#pricing" className="cursor-pointer w-full navbar-dropdown-item" aria-label="Ir para seção de recursos">
              {t('nav.features')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="#specifications" className="cursor-pointer w-full navbar-dropdown-item" aria-label="Ver especificações técnicas">
              {t('nav.specs')}
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Menu Credibilidade agrupado */}
      <DropdownMenu>
        <DropdownMenuTrigger className={`flex items-center gap-1 ${className}`} aria-label="Menu de credibilidade">
          Credibilidade
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="navbar-dropdown">
          <DropdownMenuItem asChild>
            <a href="#testimonials-gallery" className="cursor-pointer w-full navbar-dropdown-item" aria-label="Ver depoimentos de clientes">
              {t('nav.testimonials')}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="#influencers" className="cursor-pointer w-full navbar-dropdown-item" aria-label="Ver reconhecimento de influenciadores">
              {t('recognition.title')}
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <a href="#success" className={className} aria-label="Ver casos de sucesso">
        {t('roi.title')}
      </a>

      <Link href="/blog">
        <a className={className} aria-label="Ir para o blog">
          Blog
        </a>
      </Link>

      <Link href="/map">
        <a className={className} aria-label="Ver mapa interativo">
          {t('nav.about')}
        </a>
      </Link>
    </>
  );
}
