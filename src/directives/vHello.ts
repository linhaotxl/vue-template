import type { Directive } from 'vue'

export const vHello: Directive<HTMLElement, string | undefined> = {
  created(el, binding, vnode) {
    console.log(el)
    console.log(binding.value)
    console.log(vnode)
  },
}
