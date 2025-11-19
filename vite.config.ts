import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
//import { VitePWA } from 'vite-plugin-pwa'
import { NUDE_URL } from './src/modules/apiConfig.ts';


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), 
//    VitePWA({
//   registerType: 'autoUpdate',
//   devOptions: {
//     enabled: true,
//   },
//   manifest:{
//     name: "UPS",
//     short_name: "UPS",
//     start_url: "/ReactCalcUPS/",
//     display: "standalone",
//     background_color: "#fdfdfd",
//     theme_color: "#db4938",
//     orientation: "portrait-primary",
//     icons: [
//       {
//       	"src": "/ReactCalcUPS/logo192.png",
//       	"type": "image/png", "sizes": "192x192"
//       },
//       {
//       	"src": "/ReactCalcUPS/logo512.png",
//       	"type": "image/png", "sizes": "512x512"
//       }
//     ],
//   }
// })
],
  //base: "/ReactCalcUPS",
  server: {
    // https:{
    // key: fs.readFileSync(path.resolve(__dirname, 'cert.key')),
    // cert: fs.readFileSync(path.resolve(__dirname, 'cert.crt')),
    // },
    proxy: {'/api': `http://${NUDE_URL}:8080`, NUDE_URL },
    host: true,
    port: 3000, 
  },
});
