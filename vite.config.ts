import { defineConfig } from 'vite';
import { resolve } from 'path';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.wgsl', '**/*.glsl', '**/*.vert', '**/*.frag'],
      compress: false,
      watch: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@scenes': resolve(__dirname, 'src/scenes'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@shaders': resolve(__dirname, 'src/shaders'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core'],
          'babylon-materials': ['@babylonjs/materials'],
          'babylon-post': ['@babylonjs/post-processes'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
