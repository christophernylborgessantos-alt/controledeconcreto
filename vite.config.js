import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins:[react()],
  server:{host:'127.0.0.1'},
  build:{rollupOptions:{output:{
    assetFileNames: asset => asset.names.includes('eng.traineddata.gz')
      ? 'assets/ocr-v1/eng.traineddata.gz'
      : 'assets/[name]-[hash][extname]'
  }}}
});
