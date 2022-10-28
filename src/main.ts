import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import HelloWorld from './components/HelloWorld.vue'

const app = createApp(App)

app.component(HelloWorld.name, HelloWorld)

app.mount('#app')
