import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(), // 支持 tsconfig.json 中的路径别名
  ],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      // 如果你没有用 vite-tsconfig-paths，也可以手动配置别名：
      // '@': '/src'
    },
  },
  server: {
    port: 3000,
  },
});
