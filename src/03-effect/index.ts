type Effect = (...args: unknown[]) => unknown

// 当前激活的 effect
let activeEffect: Effect | null = null

function effect(fn: Effect) {
  activeEffect = fn
}

// 存储 effect 的桶
const effectStack = new WeakMap<object, Map<string | symbol, Set<Effect>>>()

// 原始数据
const source: { name: number; age?: number } = { name: 0 }

// 响应对象
const target = new Proxy(source, {
  get(target, key, receiver) {
    track(target, key)
    return Reflect.get(target, key, receiver)
  },

  set(target, p, newValue, receiver) {
    trigger(target, p)
    return Reflect.set(target, p, newValue, receiver)
  },
})

/**
 * 追踪 target 的 key
 * @param target
 * @param key
 */
function track(target: object, key: string | symbol) {
  if (activeEffect) {
    let maps = effectStack.get(target)
    if (!maps) {
      effectStack.set(target, (maps = new Map()))
    }

    let deps = maps.get(key)
    if (!deps) {
      maps.set(key, (deps = new Set()))
    }

    deps.add(activeEffect)
  }
}

/**
 * 触发 target 的 key
 * @param target
 * @param key
 * @returns
 */
function trigger(target: object, key: string | symbol) {
  const maps = effectStack.get(target)
  let deps: Set<Effect> | undefined
  if (!maps || !(deps = maps.get(key))) {
    return
  }

  deps.forEach(dep => {
    dep()
  })
}

effect(() => {
  console.log('effect 执行')
  document.title = `${target.name}`
})

setInterval(() => {
  target.name++
  // target.age = 2
}, 1000)

export {}
