/** 重置样式 这里引入自定义的重置样式也可 */
import '@unocss/reset/tailwind.css'

/** 项目内的样式，最好放在重置样式后，uno.css前  */
import './styles/index.scss'

/** 引入uno.css，不引入不生效 */
import 'uno.css'

import { createApp } from 'vue'

import { router } from './router'

import App from '~/App.vue'

const app = createApp(App)

app.use(router)

app.mount('#root')
