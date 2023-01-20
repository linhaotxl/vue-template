/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client" />
/// <reference types="vite-plugin-vue-layouts/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * 扩展 env
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ImportMetaEnv {
  // ...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
