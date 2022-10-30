import { isRef, onScopeDispose, watch, WatchStopHandle } from 'vue'
import { MaybeRef } from '../shared'

type WindowEventName = keyof WindowEventMap
type DocumentEventName = keyof DocumentEventMap

type InferEventTarget<T> = {
  addEventListener(event: T, fn: any, options?: any): any
  removeEventListener(event: T, fn: any, options?: any): any
}

type GlobalEventHandle = () => void

type UseEventListenerReturn = () => void

export function useEventListener<T extends WindowEventName>(
  event: T,
  fn: (this: Window, e: WindowEventMap[T]) => any
): UseEventListenerReturn

export function useEventListener<T extends WindowEventName>(
  target: Window,
  event: T,
  fn: (this: Window, e: WindowEventMap[T]) => any
): UseEventListenerReturn

export function useEventListener<T extends DocumentEventName>(
  target: Document,
  event: T,
  fn: (this: Document, e: DocumentEventMap[T]) => any
): UseEventListenerReturn

export function useEventListener<T extends string, E = Event>(
  target: InferEventTarget<T>,
  event: T,
  fn: (e: E) => any
): UseEventListenerReturn

export function useEventListener<T extends string, E extends Event>(
  target: MaybeRef<InferEventTarget<T> | null | undefined>,
  event: T,
  fn: (e: E) => any
): UseEventListenerReturn

export function useEventListener(...args: unknown[]): UseEventListenerReturn {
  let target: Window | Document | HTMLElement | undefined | null =
    args[0] as any
  let targetIsRef = false
  let event: string = args[1] as string
  let listener = args[2] as GlobalEventHandle

  if (typeof args[0] === 'string') {
    target = window
    ;[event, listener] = args as any
  } else if (isRef(args[0])) {
    targetIsRef = true
  }

  let clean: (() => void) | undefined
  let stopWatch: WatchStopHandle | undefined

  if (targetIsRef) {
    stopWatch = watch(
      target!,
      el => {
        clean?.()

        if (el) {
          register(el)
        }
      },
      { immediate: true }
    )
  } else {
    register(target!)
  }

  function register(el: Window | Document | HTMLElement) {
    el!.addEventListener(event, listener)

    clean = () => {
      el.removeEventListener(event, listener)
      clean = undefined
    }
  }

  function stop() {
    clean?.()
    stopWatch?.()
  }

  onScopeDispose(stop)

  return stop
}
