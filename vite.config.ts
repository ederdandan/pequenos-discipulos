import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// @ts-ignore -- o projeto não tem @types/node; o Vite roda no Node e o módulo existe.
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };

/** Commit curto do build (no deploy vem do GitHub Actions). Sem git: "local". */
function commit() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'local';
  }
}

// base './' gera caminhos relativos: funciona em https://<user>.github.io/pequenos-discipulos/
// sem precisar configurar o nome do repositório.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  define: {
    // Mostrados no fim da aba Perfil e em Perfil → Atualizações.
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT__: JSON.stringify(commit()),
    __BUILD_DATE__: JSON.stringify(
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }),
    ),
  },
});
