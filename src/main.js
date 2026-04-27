import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Importar index.js

const app = createApp(App);

app.use(router); 
app.mount('#app');