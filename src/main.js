import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Pinia'yı çağırdık
import App from './App.vue'
import router from './router'       // 2. Router'ı çağırdık (birazdan oluşturacağız)
import './style.css'                // 3. Tailwind CSS'i çağırdık

const app = createApp(App)

app.use(createPinia()) // Pinia'yı aktifleştir
app.use(router)        // Router'ı aktifleştir

app.mount('#app')