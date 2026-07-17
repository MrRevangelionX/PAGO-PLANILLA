import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.API_PORT || 4000;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": `http://localhost:${apiPort}`,
      },
    },
  };
});
