import { invokeArrayFns, isArray, ShapeFlags } from '@vue/shared'
import {
  createComponentInstance,
  LifecycleHooks,
  setCurrentInstance,
  setupComponent,
} from './component'
import type { ComponentInternalInstance } from './component'
import { h } from './h'
import { isVNode, normalizeVNode, Text, VNode } from './vnode'
import { renderComponentRoot } from './componentRenderUtils'
import { updateProps } from './componentProps'
import { effect } from '@vue/reactivity'
import { queueJob } from './scheduler'

export interface Renderer<HostElement = RendererElement> {
  render: RootRenderFunction<HostElement>
  createApp: Function
}

export type RootRenderFunction<HostElement = RendererElement> = (
  vNode: VNode,
  container: HostElement
) => void

export type PatchFn<HostElement = RendererElement> = (
  n1: VNode | null,
  n2: VNode,
  container: HostElement
) => void

// export interface RendererNode {
//   [key: string]: any
// }

export type RendererElement = {
  [x: string]: any
}

export interface RendererOptions<
  HostElement extends RendererElement = RendererElement
> {
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any): void

  insert(el: HostElement, container: HostElement): void

  createText(text: string): HostElement
  createElement(type: string): HostElement

  setText(node: HostElement, text: string): void
  setElementText(node: HostElement, text: string): void
}

export function createRenderer(options: RendererOptions) {
  return baseRenderer(options)
}

function baseRenderer<HostElement extends RendererElement = RendererElement>(
  options: RendererOptions<HostElement>
): Renderer<HostElement> {
  const {
    createElement: hostCreateElement,
    createText: hostCreateText,
    insert: hostInsert,
    patchProp: hostPatchProps,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = options

  const patch: PatchFn<HostElement> = (n1, n2, container) => {
    if (n2.shapeFlag & ShapeFlags.ELEMENT) {
      processElement(n1, n2, container)
    } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(n1, n2, container)
    } else {
      processText(n1, n2, container)
    }
  }

  /**
   * 处理元素节点
   * @param n1
   * @param n2
   * @param container
   */
  const processElement = (
    n1: VNode | null,
    n2: VNode,
    container: HostElement
  ) => {
    if (!n1) {
      mountElement(n2, container)
    } else {
      n2.el = n1.el
      // TODO:
      hostSetElementText(n2.el as any, n2.children as string)
    }
  }

  /**
   * 处理文本节点
   * @param n1
   * @param n2
   * @param container
   */
  const processText = (n1: VNode | null, n2: VNode, container: HostElement) => {
    if (!n1) {
      mountText(n2, container)
    } else {
      const el = (n2.el = n1.el)! as any
      hostSetText(el, n2.children as string)
    }
  }

  /**
   * 处理组件节点
   * @param n1
   * @param n2
   * @param container
   */
  const processComponent = (
    n1: VNode | null,
    n2: VNode,
    container: HostElement
  ) => {
    if (!n1) {
      mountComponent(n2, container)
    } else {
      updateComponent(n1, n2)
    }
  }

  /**
   * 挂载元素
   * @param vNode
   * @param container
   */
  const mountElement = (vNode: VNode, container: HostElement) => {
    const { type, props, children } = vNode
    // 创建真实元素节点，并挂在在 vNode 的 el 上
    const el = (vNode.el = hostCreateElement(type as string))

    // 为真实节点设置 props
    if (props) {
      for (const key in props) {
        hostPatchProps(el, key, null, props[key])
      }
    }

    // 处理子节点
    if (children) {
      mountChildren(children, el)
    }

    // 插入容器节点
    hostInsert(el, container)
  }

  /**
   * 挂载组件
   * @param vNode
   * @param container
   */
  const mountComponent = (vNode: VNode, container: HostElement) => {
    // 1. 创建组件实例
    const instance = (vNode.component = createComponentInstance(vNode))

    // 设置当前正在执行的组件
    setCurrentInstance(instance)

    // 2. 安装组件
    setupComponent(instance)

    // 3. 安装组件更新逻辑
    setupRenderEffect(instance, container)
  }

  /**
   * 更新组件
   * @param instance
   * @param container
   */
  const updateComponent = (n1: VNode, n2: VNode) => {
    // 将组件实例同步到新节点上，当下一次继续 render 时，现在的新节点将作为下一次的旧节点，确保能
    const instance = (n2.component = n1.component!)

    // 渲染前执行一些其他逻辑
    updateComponentPreRender(instance, n1, n2)

    instance.effect!.effect.run()
  }

  /**
   * 组件更新在 render 之前的操作
   */
  const updateComponentPreRender = (
    instance: ComponentInternalInstance,
    n1: VNode,
    n2: VNode
  ) => {
    // 更新 props
    const rawPrevProps = n1.props
    updateProps(instance, rawPrevProps, n2)
  }

  /**
   * 创建组件更新函数
   * @param instance
   * @param container
   */
  const setupRenderEffect = (
    instance: ComponentInternalInstance,
    container: HostElement
  ) => {
    // 实际的更新函数
    const updateComponent = () => {
      if (!instance.isMounted) {
        // 挂载组件

        const {
          [LifecycleHooks.BEFORE_MOUNT]: bm,
          [LifecycleHooks.MOUNTED]: m,
        } = instance

        // 执行 before mount hook
        if (bm) {
          invokeArrayFns(bm)
        }

        // 执行 render 获取子节点树
        const subTree = (instance.subTree = renderComponentRoot(instance))

        // 挂载子节点树
        patch(null, subTree, container)

        // 标识组件挂载完成
        instance.isMounted = true

        // 执行 mounted hook
        if (m) {
          invokeArrayFns(m)
        }
      } else {
        // 更新组件

        const {
          subTree: preSubtree,
          [LifecycleHooks.BEFORE_UPDATE]: bu,
          [LifecycleHooks.UPDATED]: u,
        } = instance

        // 执行 before update hook
        if (bu) {
          invokeArrayFns(bu)
        }

        // 执行 render 获取新子节点树
        const newSubTree = (instance.subTree = renderComponentRoot(instance))

        // 新旧子节点进行对比
        patch(preSubtree, newSubTree, container)

        // 执行 updated hook
        if (u) {
          invokeArrayFns(u)
        }
      }

      // 组件挂载/更新完成，清空正在执行的组件
      setCurrentInstance(null)
    }

    const update = () => {
      instance.effect!.effect.run()
    }

    // 创建更新的依赖，在更新过程中遇到响应式数据会收集组件更新的 effect
    // 同时设置调度任务，当触发这个 effect 时，会将组件更新函数放入队列，等待异步更新
    instance.effect = effect(updateComponent, {
      scheduler: () => queueJob(update),
    })
  }

  const mountText = (vNode: VNode, container: HostElement) => {
    const text = (vNode.el = hostCreateText(vNode.children as string))
    hostInsert(text, container)
  }

  const render: RootRenderFunction<HostElement> = (vNode, container: any) => {
    patch(container.__root || null, vNode, container)
    container.__root = vNode
  }

  const mountChildren = (children: unknown, container: HostElement) => {
    if (isArray(children)) {
      for (let i = 0; i < children.length; ++i) {
        const child = normalizeVNode(children[i])
        patch(null, child, container)
      }
    } else {
      patch(null, normalizeVNode(children), container)
    }
  }

  return {
    render,
    createApp() {},
  }
}
