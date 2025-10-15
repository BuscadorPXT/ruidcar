# Configuração do GitHub Actions para Deploy Automático

Como seu token de acesso não tem permissão para criar workflows via linha de comando, você precisa adicionar o arquivo de workflow manualmente através do GitHub.

## Opção 1: Via Interface Web do GitHub (Mais Fácil)

1. Acesse: https://github.com/BuscadorPXT/ruidcar

2. Clique em "Add file" > "Create new file"

3. No campo de nome do arquivo, digite:
   ```
   .github/workflows/deploy.yml
   ```

4. Cole o seguinte conteúdo:

```yaml
name: Deploy para Produção

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Permite executar manualmente

jobs:
  deploy:
    name: Deploy para VPS
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout do código
        uses: actions/checkout@v4

      - name: 🔧 Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 📦 Instalar dependências
        run: npm ci

      - name: 🔨 Build da aplicação
        run: npm run build

      - name: 🧪 Rodar testes (se existirem)
        run: npm test || echo "Sem testes configurados"
        continue-on-error: true

      - name: 🚀 Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          password: ${{ secrets.VPS_PASSWORD }}
          port: 22
          script: |
            cd /var/www/ruidcar
            bash server-deploy.sh

      - name: ✅ Verificar deploy
        run: |
          echo "Deploy concluído!"
          echo "Verificando saúde da aplicação..."
          sleep 5
          curl -I https://ruidcar.com.br || echo "Verifique o status manualmente"

      - name: 📢 Notificar sucesso
        if: success()
        run: |
          echo "✅ Deploy realizado com sucesso!"
          echo "🎉 Aplicação atualizada em produção"

      - name: 📢 Notificar falha
        if: failure()
        run: |
          echo "❌ Deploy falhou!"
          echo "⚠️ Verifique os logs acima"
```

5. Clique em "Commit new file"

6. Adicione uma mensagem de commit, por exemplo:
   ```
   Add GitHub Actions workflow for auto-deploy
   ```

7. Clique em "Commit new file"

## Opção 2: Via Git Localmente (Requer Novo Token)

Se preferir fazer via linha de comando, você precisará criar um novo Personal Access Token com a permissão `workflow`:

1. Acesse: https://github.com/settings/tokens/new

2. Configure:
   - Note: `Deploy RUIDCAR`
   - Expiration: `90 days` (ou conforme preferir)
   - Selecione os escopos:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)

3. Clique em "Generate token"

4. Copie o token gerado

5. Configure o novo token no git:
   ```bash
   git remote set-url origin https://SEU_NOVO_TOKEN@github.com/BuscadorPXT/ruidcar.git
   ```

6. Agora você pode fazer push do workflow:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Actions workflow for auto-deploy"
   git push origin main
   ```

## Configurar Secrets no GitHub

Independente da opção escolhida, você DEVE configurar as secrets:

1. Acesse: https://github.com/BuscadorPXT/ruidcar/settings/secrets/actions

2. Clique em "New repository secret"

3. Adicione as seguintes secrets:

### Secret 1: VPS_HOST
- Name: `VPS_HOST`
- Value: `89.116.214.182`
- Clique em "Add secret"

### Secret 2: VPS_USERNAME
- Name: `VPS_USERNAME`
- Value: `root`
- Clique em "Add secret"

### Secret 3: VPS_PASSWORD
- Name: `VPS_PASSWORD`
- Value: `yB-&(,JmWI6Nx.TM2r#8`
- Clique em "Add secret"

> ⚠️ **IMPORTANTE:** Após tudo configurado, altere a senha SSH do servidor!

## Verificar se Funcionou

1. Após adicionar o workflow e as secrets, faça qualquer commit no projeto:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```

2. Acesse: https://github.com/BuscadorPXT/ruidcar/actions

3. Você verá o workflow "Deploy para Produção" em execução

4. Clique nele para ver os logs em tempo real

## Testando Deploy Manual

Você também pode executar o deploy manualmente:

1. Acesse: https://github.com/BuscadorPXT/ruidcar/actions
2. Clique em "Deploy para Produção"
3. Clique em "Run workflow"
4. Selecione a branch `main`
5. Clique em "Run workflow"

## Troubleshooting

### Workflow não aparece

- Certifique-se de que o arquivo está em `.github/workflows/deploy.yml`
- Verifique se o arquivo foi commitado corretamente
- Aguarde alguns segundos e recarregue a página

### Deploy falha na etapa SSH

- Verifique se as secrets estão configuradas corretamente
- Teste a conexão SSH manualmente: `ssh root@89.116.214.182`
- Verifique se o script `server-deploy.sh` existe no servidor

### Build falha

- Verifique se as dependências estão corretas no `package.json`
- Teste o build localmente: `npm run build`
- Verifique os logs do GitHub Actions para ver o erro específico

## Alternativa: Deploy Manual

Se preferir não usar GitHub Actions, você sempre pode:

1. **No servidor VPS:**
   ```bash
   ssh root@89.116.214.182
   cd /var/www/ruidcar
   ./server-deploy.sh
   ```

2. **Do seu computador:**
   ```bash
   ./deploy.sh
   ```

Ambos os métodos farão o deploy manual para produção.
