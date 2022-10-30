import HelloWorld from './components/HelloWorld.vue'
import { VirtualList } from './core/useVirtualList'
import { vHello } from './directives/vHello'

declare module 'vue' {
  export interface GlobalComponents {
    HelloWorld: typeof HelloWorld
    VirtualList: typeof VirtualList
  }

  export interface GlobalDirectives {
    vHello: typeof vHello
  }

  export interface ComponentCustomProperties {
    vHello: typeof vHello
  }
}
