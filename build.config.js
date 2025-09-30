import esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Garantir que os diretórios existam
try {
  mkdirSync('dist/services', { recursive: true });
} catch {}

// Build principal
await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  sourcemap: false,
  minify: false,
  keepNames: true,
  treeShaking: true,
  resolveExtensions: ['.ts', '.js', '.json'],
  loader: {
    '.ts': 'ts'
  },
  // Configuração otimizada para incluir serviços mas manter dependências externas
});

// Compilar serviços de IA separadamente se necessário
const services = [
  'server/services/geo-intelligence.ts',
  'server/services/gemini-ai.ts',
  'server/routes/leads-intelligence.ts'
];

for (const service of services) {
  await esbuild.build({
    entryPoints: [service],
    bundle: false,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outdir: 'dist',
    sourcemap: false,
    minify: false,
    keepNames: true,
    resolveExtensions: ['.ts', '.js', '.json'],
    loader: {
      '.ts': 'ts'
    }
  });
}

console.log('✅ Build completo com serviços de IA incluídos');