import { getCurrentInstance, LifecycleHooks } from './component'

function createHook(type: LifecycleHooks) {
  return function (hook: () => any, instance = getCurrentInstance()) {
    if (instance) {
      instance[type] ||= []
      instance[type]!.push(hook)
    }
  }
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)

export const onMounted = createHook(LifecycleHooks.MOUNTED)

export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)

export const onUpdated = createHook(LifecycleHooks.UPDATED)
