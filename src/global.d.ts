import HelloWorld from './components/HelloWorld.vue'
import { VirtualList, UMouse } from './core'
import { vHello } from './directives/vHello'

declare module 'vue' {
  export interface GlobalComponents {
    HelloWorld: typeof HelloWorld
    VirtualList: typeof VirtualList
    UMouse: typeof UMouse
  }

  export interface GlobalDirectives {
    vHello: typeof vHello
  }

  export interface ComponentCustomProperties {
    vHello: typeof vHello
  }
}
