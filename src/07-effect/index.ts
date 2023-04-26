/**
 * effect 收集依赖的函数
 */
interface Effect {
  (...args: unknown[]): unknown

  /**
   * 表明 effect 被哪些依赖集合收集过
   */
  deps?: Set<Effect>[]

  options?: EffectOptions
}

interface EffectOptions {
  schedule?: (effect: Effect) => void
}

// 当前激活的 effect
let activeEffect: Effect | undefined = undefined

// effect 栈
const effectStack: Effect[] = []

/**
 * key: 原始对象
 * value: Map
 *  key: 收集依赖的属性
 *  value: 访问 key 收集的依赖集合
 */
const targetMap = new WeakMap<object, Map<string | symbol, Set<Effect>>>()

/**
 * 创建 effect 函数，用来收集 fn 所产生的依赖
 * @param fn 依赖收集的函数
 */
function effect(fn: Effect, options?: EffectOptions) {
  const effectFn: Effect = () => {
    // 每次调用原始函数前都需要清空追踪的依赖
    cleanUp(effectFn)
    // 标记当前正在执行的 effect 并入栈
    effectStack.push((activeEffect = effectFn))

    // 调用原始函数
    fn()
    // 调用完成后恢复 activeEffect，只有在 effect 原始函数中才会追踪依赖
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }

  effectFn.options = options

  effectFn()
}

// 原始数据
const source: { name: number; age?: number; enable: boolean } = {
  name: 0,
  enable: true,
}

// 响应对象
const ovserver = new Proxy(source, {
  get(target, key, receiver) {
    track(target, key)
    return Reflect.get(target, key, receiver)
  },

  set(target, p, newValue, receiver) {
    const res = Reflect.set(target, p, newValue, receiver)
    trigger(target, p)
    return res
  },
})

/**
 * 追踪 target 的 key
 * @param target
 * @param key
 */
function track(target: object, key: string | symbol) {
  if (activeEffect) {
    let maps = targetMap.get(target)
    if (!maps) {
      targetMap.set(target, (maps = new Map()))
    }

    let deps = maps.get(key)
    if (!deps) {
      maps.set(key, (deps = new Set()))
    }

    if (!deps.has(activeEffect)) {
      deps.add(activeEffect)
      if (!activeEffect.deps) {
        activeEffect.deps = []
      }
      activeEffect.deps.push(deps)
    }
  }
}

/**
 * 清空 effect 所有追踪的依赖
 */
function cleanUp(effect: Effect) {
  if (effect.deps) {
    // 这里将 deps 中当前的 effect 删除
    // 由于 effect.deps 中存储的和 targetMap 是同一内存，所以 targetMap 中也会被删除
    for (const dep of effect.deps) {
      dep.delete(effect)
    }

    // 将当前 effect 的所有依赖移除，下次调用再次追踪
    effect.deps.length = 0
  }
}

/**
 * 触发 target 的 key
 * @param target
 * @param key
 * @returns
 */
function trigger(target: object, key: string | symbol) {
  const maps = targetMap.get(target)
  let effects: Set<Effect> | undefined
  if (!maps || !(effects = maps.get(key))) {
    return
  }

  // 重新创建收集到的 effects 集合，避免无限循环
  const runEffects = new Set(effects)
  for (const effect of runEffects) {
    // 过滤当前正在执行的 effect，避免自身追踪、触发自己造成无限循环
    if (effect !== activeEffect) {
      // 优先使用调度器来执行依赖函数
      if (effect.options?.schedule) {
        effect.options.schedule(effect)
      } else {
        effect()
      }
    }
  }
}

console.log('main1 start')

effect(
  () => {
    console.log(ovserver.enable)
  },
  {
    schedule(effect) {
      setTimeout(effect)
    },
  }
)

ovserver.enable = false

console.log('main1 end')

export {}
