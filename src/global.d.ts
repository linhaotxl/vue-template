import HelloWorld from './components/HelloWorld.vue'
import { VirtualList, UMouse, UElementBounding } from './core'
import { vHello } from './directives/vHello'

declare module 'vue' {
  export interface GlobalComponents {
    HelloWorld: typeof HelloWorld
    VirtualList: typeof VirtualList
    UMouse: typeof UMouse
    UElementBounding: typeof UElementBounding
  }

  export interface GlobalDirectives {
    vHello: typeof vHello
  }

  export interface ComponentCustomProperties {
    vHello: typeof vHello
  }
}
