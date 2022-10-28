import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { VirtualList } from './core/useVirtualList'

const app = createApp(App)

app.component(VirtualList.name, VirtualList)

app.mount('#app')
