

# vscode 插件

1. `ESlint`

2. `Prettier - Code formatter`

3. `Stylelint`

4. `EditorConfig for VS Code`

5. `Vue Language Features (Volar)`，使用 `Vue3` 最好禁用 `Vetur`

6. `UnoCSS`



# 官方文档

1. [Vue3](https://cn.vuejs.org/)

2. [Vite](https://cn.vitejs.dev/)



# 已完成清单

1. `JSX` 书写 `vue` 组件，参考 `src/components/TextCompTsx.tsx`

2. 集成 `unocss` 样式配置

3. `.vue` 文件 `setup` 语法配置

4. 自动引入 `api`

5. 继承 `ElementPlus`，按需引入



# unocss 配置

[官方文档](https://github.com/unocss/unocss)

配置文件是 `unocss.config.ts` ，可以配置变量，快捷 `class` 等，内置的 `class` 可以参考 [Tailwind CSS](https://www.tailwindcss.cn/)

## 两种书写方法

1. 写在 `class` 内
   
   ```html
   <div class="box flex justify-center items-center"></div>
   ```

2. 作为标签属性
   
   ```html
   <div class="box" flex justify-center items-center></div>
   ```

## 扩展主题

当内置的主题不够使用时，可以进行扩展。例如扩展了颜色主题后，那么带有颜色的 `class` 都可以使用

```ts
// unocss.config.ts
export default defineConfig({
  theme: {
    color: {
      primary: 'var(--primary-color)'
    }  
  }
})
```

```html
<!-- color: var(--prmairy-color) -->
<div class="text-primary"></div>
<!-- background-color: var(--prmairy-color) -->
<div class="bg-primary"></div>
```

更多可扩展的主题参考 [主题配置](https://www.tailwindcss.cn/docs/theme)

# 

# setup 语法

要是想在 `setup` 语法内定义 `name` 或 `inheritAttrs` 等属性，可以使用以下方法

1. 同时使用 `script` 和 `script setup`
   
   ```html
   <script>
   export default {
     name: "Comp",
     inheritAttrs: false
   }
   </script>
   
   <script setup lang="ts">
   // ...
   </script>
   ```

2. 在 `script` 标签上定义 `name`
   
   这种方法只能定义 `name` ，需要使用 `vite-plugin-vue-setup-extend` 插件，已经集成进来了。
   
   注意，要是想定义其他属性，只能使用第1种方法
   
   ```html
   <script setup lang="ts" name="Comp"></script>
   ```

# 

# 自动引入api

使用 `unplugin-auto-import` 插件无需手动 `import`，可以直接使用具体的 `api`。目前已经自动引入了 `vue`，`vue-router`，`vueuse` 以及 `ElementPlus`

具体配置可以参考 `vite.config.ts` 中的 `AutoImport`

```ts
// before
import { ref } from 'vue'
const count = ref(1)

// after
const count = ref(1)
```

注意，自动引入成功后，会生成 `auto-imports.d.ts` （用于 `ts`）和 `eslintrc-auto-import.json`（用于 `eslint`）。如果在某个文件(`login.vue`)中使用了 `ElMessage`，如果不打开 `login` 页面，那么自动引入的文件中可能不存在 `ElMessage` 全局变量，此时必须打开 `login` 页面即可。这是由于 `Vite` 的机制决定的。后期优化



# 自动导入组件

常规导入足迹按需要两步，`setup` 语法只有第一步

1. `import` 组件

2. 注册组件

使用 `unplugin-vue-components` 插件可以帮助我们自动导入组件，无需再进行上述两个步骤，具体配置参考 `vite.config.ts` 中的 `Components`

同时会生成 `components.d.ts` 文件，`Volar` 会读取这个文件中的内容，实现组件的跳转和参数校验



# 文件式路由

可以使用 `vite-plugin-pages` 和 `vite-plugin-vue-layouts` 根据文件来生成路由和布局，不需要再手动定义。

目前暂未开启，只需要取消 `vite.config.ts` 和 `src/router.ts`的注释即可打开
