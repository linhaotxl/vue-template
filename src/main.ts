import { createApp } from 'vue'
import './style.css'
import App from './App2.vue'
import { VirtualList } from './core/useVirtualList'
import HelloWorld from './components/HelloWorld.vue'

const app = createApp(App)

app.component(VirtualList.name, VirtualList)
app.component(HelloWorld.name, HelloWorld)

app.mount('#app')
