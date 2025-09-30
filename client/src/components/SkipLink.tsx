import { useRef } from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function SkipLink({ href, children }: SkipLinkProps) {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.setAttribute('tabindex', '-1');
      (target as HTMLElement).focus();
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  };

  return (
    <a
      ref={skipLinkRef}
      href={href}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          skipLinkRef.current?.click();
        }
      }}
    >
      {children}
    </a>
  );
}