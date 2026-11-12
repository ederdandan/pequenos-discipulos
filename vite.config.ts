import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' gera caminhos relativos: funciona em https://<user>.github.io/pequenos-discipulos/
// sem precisar configurar o nome do repositório.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  define: {
    // Mostrada em Perfil → Atualizações.
    __BUILD_DATE__: JSON.stringify(
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }),
    ),
  },
});
