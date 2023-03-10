/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * 扩展自定义 env
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ImportMetaEnv {
  // ...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
