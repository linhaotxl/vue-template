import { invokeArrayFns, isArray, ShapeFlags } from '@vue/shared'
import {
  createComponentInstance,
  LifecycleHooks,
  setCurrentInstance,
  setupComponent,
} from './component'
import type { ComponentInternalInstance } from './component'
import {
  Comment,
  Fragment,
  isSameVNodeType,
  normalizeVNode,
  Text,
  VNode,
} from './vnode'
import { renderComponentRoot } from './componentRenderUtils'
import { updateProps } from './componentProps'
import { effect } from '@vue/reactivity'
import { flushPostFlushCbs, queueJob, queuePostFlushCb } from './scheduler'
import { createAppAPI } from './apiCreateApp'

export interface Renderer<HostElement = RendererElement> {
  render: RootRenderFunction<HostElement>
  createApp: Function
}

export type RootRenderFunction<HostElement = RendererElement> = (
  vNode: VNode | null,
  container: HostElement
) => void

export type PatchFn<HostElement = RendererElement> = (
  n1: VNode | null,
  n2: VNode,
  container: HostElement,
  parent?: ComponentInternalInstance
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

  /**
   * 插入节点
   * @param el 插入的节点
   * @param container 容器
   */
  insert(el: HostElement, container: HostElement): void

  /**
   * 创建文本节点
   * @param text 文本节点内容
   */
  createText(text: string): HostElement

  /**
   * 创建元素节点
   * @param type 标签名
   */
  createElement(type: string): HostElement

  /**
   * 创建注释节点
   * @param text 注释内容
   */
  createComment(text: string): HostElement

  /**
   * 设置文本节点内容
   * @param node 文本节点
   * @param text 更新内容
   */
  setText(node: HostElement, text: string): void

  /**
   * 设置元素节点内容
   * @param node 元素节点
   * @param text 更新文本
   */
  setElementText(node: HostElement, text: string): void

  /**
   * 移除节点
   * @param el
   */
  remove(el: HostElement): void
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
    createComment: hostCreateComment,
    insert: hostInsert,
    patchProp: hostPatchProps,
    setText: hostSetText,
    setElementText: hostSetElementText,
    remove: hostRemove,
  } = options

  const patch: PatchFn<HostElement> = (n1, n2, container, parent) => {
    // 如果新旧节点不是同一类型的节点时，需要卸载旧节点，并挂在 n2
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1, true)
      n1 = null
    }

    if (n2.type === Comment) {
      processCommment(n1, n2, container)
    } else if (n2.type === Text) {
      processText(n1, n2, container)
    } else if (n2.type === Fragment) {
      processFragment(n1, n2, container)
    } else {
      if (n2.shapeFlag & ShapeFlags.ELEMENT) {
        processElement(n1, n2, container)
      } else if (
        n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT ||
        n2.shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT
      ) {
        processComponent(n1, n2, container, parent)
      }
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
      updateElement(n1, n2, container)
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
    container: HostElement,
    parent?: ComponentInternalInstance
  ) => {
    if (!n1) {
      mountComponent(n2, container, parent)
    } else {
      updateComponent(n1, n2)
    }
  }

  /**
   * 处理注释节点
   * @param n1
   * @param n2
   * @param container
   */
  const processCommment = (
    n1: VNode | null,
    n2: VNode,
    container: HostElement
  ) => {
    if (!n1) {
      n2.el = hostCreateComment(n2.children as string)
      hostInsert(n2.el as HostElement, container)
    }
  }

  /**
   * 处理 Fragment
   * @param n1
   * @param n2
   * @param container
   */
  const processFragment = (
    n1: VNode | null,
    n2: VNode,
    container: HostElement
  ) => {
    if (!n1) {
      mountChildren(n2.children, container)
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

  const updateElement = (n1: VNode, n2: VNode, container: HostElement) => {
    const el = (n2.el = n1.el)
    const oldProps = n1.props
    const newProps = n2.props

    for (const key in newProps) {
      hostPatchProps(el as HostElement, key, oldProps?.[key], newProps[key])
    }

    // TODO:
    hostSetElementText(n2.el as any, n2.children as string)
  }

  /**
   * 挂载组件
   * @param vNode
   * @param container
   */
  const mountComponent = (
    vNode: VNode,
    container: HostElement,
    parent?: ComponentInternalInstance
  ) => {
    // 1. 创建组件实例
    const instance = (vNode.component = createComponentInstance(vNode, parent))

    // 设置当前正在执行的组件
    setCurrentInstance(instance)

    // 2. 安装组件
    setupComponent(instance)

    // 3. 安装组件更新逻辑
    setupRenderEffect(instance, container)
  }

  /**
   * 更新组件，由父组件的更新引起
   * @param instance
   * @param container
   */
  const updateComponent = (n1: VNode, n2: VNode) => {
    // 将组件实例同步到新节点上，当下一次继续 render 时，现在的新节点将作为下一次的旧节点，确保能
    const instance = (n2.component = n1.component!)

    // 渲染前执行一些其他逻辑
    updateComponentPreRender(instance, n1, n2)

    // 调用组件的更新函数
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
        patch(null, subTree, container, instance)

        // 组件的 vNode.el 实际指向子节点的 el
        instance.vNode.el = subTree.el

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

  /**
   * 卸载节点
   * @param vNode
   * @param doRemove
   */
  const unmount = (vNode: VNode, doRemove = false) => {
    // 卸载 Fragment
    if (vNode.type === Fragment) {
      unmountFragment(vNode, doRemove)
      return
    }

    // 卸载组件
    if (vNode.shapeFlag & ShapeFlags.COMPONENT) {
      unmountComponent(vNode, false)
    }

    // 删除真实节点
    if (doRemove) {
      vNode.el && hostRemove(vNode.el as HostElement)
    }
  }

  /**
   * 卸载 Fragment 组件
   * @param vNode
   * @param doRemove
   */
  const unmountFragment = (vNode: VNode, doRemove: boolean) => {
    const children = vNode.children as VNode[]

    // 首先卸载每个子节点
    unmountChildren(children, false)

    // 再删除每个子节点
    for (let i = 0; i < children.length; ++i) {
      const el = children[i].el
      if (el) {
        hostRemove(el as HostElement)
      }
    }
  }

  /**
   * 卸载组件
   * @param vNode
   * @param doRemove
   */
  const unmountComponent = (vNode: VNode, doRemove: boolean) => {
    const { component } = vNode
    const {
      [LifecycleHooks.BEFORE_UNMOUNT]: bum,
      [LifecycleHooks.UNMOUNTED]: um,
      subTree,
    } = component!

    // 执行 beforeUnmount hook
    if (bum) {
      invokeArrayFns(bum)
    }

    // 卸载子节点树，子节点树并不会删除真实的节点
    if (subTree) {
      unmount(subTree, doRemove)
    }

    // 子节点卸载完成，将 unmouted hook 放入任务队列等待执行
    // 由于此时组件对应的真实节点还没有移除，所以不能同步执行
    if (um) {
      queuePostFlushCb(() => {
        invokeArrayFns(um)
      })
    }
  }

  /**
   * 卸载子节点列表
   * @param children
   * @param doRemove
   */
  const unmountChildren = (children: VNode[], doRemove: boolean) => {
    for (let i = 0; i < children.length; ++i) {
      unmount(children[i], doRemove)
    }
  }

  const render: RootRenderFunction<HostElement> = (vNode, container: any) => {
    if (vNode == null) {
      unmount(container.__root, true)
    } else {
      patch(container.__root || null, vNode, container)
    }

    // TODO:
    flushPostFlushCbs()

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
    createApp: createAppAPI(render),
  }
}
