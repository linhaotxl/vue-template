import HelloWorld from './components/HelloWorld.vue'
import { vHello } from './directives/vHello'

declare module 'vue' {
  export interface GlobalComponents {
    HelloWorld: typeof HelloWorld
  }

  export interface GlobalDirectives {
    vHello: typeof vHello
  }

  export interface ComponentCustomProperties {
    vHello: typeof vHello
  }
}
