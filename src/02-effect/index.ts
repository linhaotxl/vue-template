type Effect = (...args: unknown[]) => unknown

// 当前激活的 effect
let activeEffect: Effect | null = null

function effect(fn: Effect) {
  activeEffect = fn
  fn()
}

// 存储 effect 的桶
const bucket: Effect[] = []

// 原始数据
const source: { name: number; age?: number } = { name: 0 }

// 响应对象
const target = new Proxy(source, {
  get(target, key, receiver) {
    if (activeEffect) {
      bucket.push(activeEffect)
    }

    return Reflect.get(target, key, receiver)
  },

  set(target, p, newValue, receiver) {
    const currentEffect = bucket.pop()
    if (currentEffect) {
      currentEffect()
    }
    return Reflect.set(target, p, newValue, receiver)
  },
})

effect(() => {
  console.log('effect 执行')
  document.title = `${target.name}`
})

setInterval(() => {
  // target.name++
  target.age = 2
}, 1000)

export {}
