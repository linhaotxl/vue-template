/** 重置样式 这里引入自定义的重置样式也可 */
import '@unocss/reset/tailwind.css'

/** 项目内的样式，最好放在重置样式后，uno.css前  */
import './style.css'

/** 引入uno.css，不引入不生效 */
import 'uno.css'

import { ProForm, ProFormItem, QueryFilter } from 'element-plus-pro-components'
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'

const app = createApp(App)

app.component(ProForm.name, ProForm)
app.component(QueryFilter.name, QueryFilter)
app.component(ProFormItem.name, ProFormItem)

app.use(router)

app.mount('#app')
