type Effect = (...args: unknown[]) => unknown

// 存储 effect 的桶
const bucket: Effect[] = []

// 原始数据
const source = { name: 0 }

// 响应对象
const target = new Proxy(source, {
  get(target, key, receiver) {
    if (effect) {
      bucket.push(effect)
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

// 当前正在执行的 effect
const effect: Effect = () => {
  document.title = `${target.name}`
}

setInterval(() => {
  target.name++
}, 1000)

effect()

export {}
