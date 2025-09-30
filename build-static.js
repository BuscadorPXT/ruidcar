// Script para copiar arquivos do cliente para pasta pública

import fs from 'fs';
import path from 'path';

const sourceDir = path.resolve('client');
const targetDir = path.resolve('server/public');

// Função recursiva para copiar diretórios
function copyDir(src, dest) {
  // Criar diretório de destino se não existir
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Ler arquivos no diretório
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Ignorar node_modules e alguns arquivos específicos
    if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'src') {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursivamente copiar diretórios
      copyDir(srcPath, destPath);
    } else {
      // Copiar arquivos
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copiado: ${srcPath} -> ${destPath}`);
    }
  }
}

console.log('Iniciando cópia de arquivos estáticos...');
console.log(`De: ${sourceDir}`);
console.log(`Para: ${targetDir}`);

try {
  // Limpar diretório de destino
  if (fs.existsSync(targetDir)) {
    console.log('Limpando diretório de destino...');
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Criar diretório novamente
  fs.mkdirSync(targetDir, { recursive: true });
  
  // Copiar arquivos
  copyDir(sourceDir, targetDir);
  
  // Criar um arquivo index.html personalizado se não existir
  const indexPath = path.join(targetDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('Criando index.html personalizado...');
    fs.copyFileSync(path.join(targetDir, 'index.html.template'), indexPath);
  }
  
  console.log('Cópia concluída com sucesso!');
} catch (error) {
  console.error('Erro ao copiar arquivos:', error);
}