import './assets/main.css'

import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'
import InfoPage from "@/components/ui/InfoPage.vue";

const app = createApp(App)

app.use(createPinia())
app.component('InfoPage', InfoPage);

app.mount('#app')
