import { computed, ComputedRef, markRaw, ref, Ref } from 'vue'
import { timestamp } from '../shared'

type CloneFn<T = any, R = T> = (value: T) => R

export interface UseManualRefHistoryOptions<Raw, Serialized = Raw> {
  /**
   * 最大记录个数
   *
   * @default Infinity
   */
  capacity?: number

  /**
   *
   */
  clone?: boolean | CloneFn<Raw>

  /**
   * 将原始数据转换为快照的函数
   *
   * @default JSON.parse(JSON.string())
   */
  dump?: (value: Raw) => Serialized

  /**
   * 将快照转换为原始数据的函数
   *
   * @default JSON.parse(JSON.string())
   */
  parse?: (value: Serialized) => Raw

  /**
   * 设置 source 方法
   *
   * @default source.value = v
   */
  setSource?: (source: Ref<Raw>, v: Raw) => void
}

export interface UseManualRefHistoryReturn<Raw, Serialized = Raw> {
  /**
   * 记录列表
   */
  history: Ref<UseRefHistoryRecord<Serialized>[]>

  /**
   * undo 记录列表
   */
  undoStack: Ref<UseRefHistoryRecord<Serialized>[]>

  /**
   * redo 记录列表
   */
  redoStack: Ref<UseRefHistoryRecord<Serialized>[]>

  /**
   * 是否可以 undo
   */
  canUndo: ComputedRef<boolean>

  /**
   * 是否可以 redo
   */
  canRedo: ComputedRef<boolean>

  /**
   * 最新一次操作的记录
   */
  last: Ref<UseRefHistoryRecord<Serialized>>

  /**
   * 撤销函数
   */
  undo(): void

  /**
   * 重做函数
   */
  redo(): void

  /**
   * 清空函数
   */
  clear(): void

  /**
   * 提交函数
   */
  commit(): void

  /**
   * 重置 source 为 last
   */
  reset(): void
}

export interface UseRefHistoryRecord<T> {
  snapshot: T
  timestamp: number
}

const fnBypass = <T, R = T>(value: T): R => value as unknown as R
const cloneFnJSON = <T, R = T>(value: T): R => JSON.parse(JSON.stringify(value))

const defaultDump = <Raw, Serialized>(clone?: boolean | CloneFn<Raw>) =>
  (clone
    ? typeof clone === 'function'
      ? clone
      : cloneFnJSON
    : fnBypass) as unknown as CloneFn<Raw, Serialized>

const defaultParse = <Raw, Serialized>(clone?: boolean | CloneFn<Raw>) =>
  (clone
    ? typeof clone === 'function'
      ? clone
      : cloneFnJSON
    : fnBypass) as unknown as CloneFn<Serialized, Raw>

const setSourceFn = <T>(source: Ref<T>, value: T) => (source.value = value)

export function useManualRefHistory<Raw, Serialized = Raw>(
  source: Ref<Raw>,
  options: UseManualRefHistoryOptions<Raw, Serialized> = {}
): UseManualRefHistoryReturn<Raw, Serialized> {
  const {
    clone,
    capacity = Infinity,
    dump = defaultDump<Raw, Serialized>(clone),
    parse = defaultParse<Raw, Serialized>(clone),
    setSource = setSourceFn,
  } = options

  // 记录列表
  const history = ref([_createHistoryRecord()]) as Ref<
    UseRefHistoryRecord<Serialized>[]
  >
  // undo 数据栈
  const undoStack = computed(() => history.value.slice(1))
  // redo 数据栈
  const redoStack = ref([]) as Ref<UseRefHistoryRecord<Serialized>[]>

  // 最新一次操作记录，始终指向第一条记录
  const last = computed(() => history.value[0])

  const canUndo = computed(() => undoStack.value.length > 0)

  const canRedo = computed(() => redoStack.value.length > 0)

  /**
   * 创建记录
   * @returns
   */
  function _createHistoryRecord(): UseRefHistoryRecord<Serialized> {
    return markRaw({ snapshot: dump(source.value), timestamp: timestamp() })
  }

  /**
   * 提交记录
   */
  function commit() {
    // 如果 undo 栈超出范围，首先将栈尾数据取出
    const _history = history.value
    if (_history.length >= capacity) {
      _history.pop()
    }
    // 创建新记录，并入 undo 栈头
    _history.unshift(_createHistoryRecord())
  }

  /**
   * 撤销操作
   */
  function undo() {
    // 将刚刚 commit 的数据取出(undo栈头数据)，并存入 redo 栈头
    const value = history.value.shift()
    if (value) {
      redoStack.value.unshift(value)
      _setState()
    }
  }

  /**
   * 重做操作
   */
  function redo() {
    // 将刚刚 undo 的数据取出(redo栈头)，并继续存入 undo 栈头(同 commit)
    const value = redoStack.value.shift()
    if (value) {
      history.value.unshift(value)
      _setState()
    }
  }

  /**
   * 清除操作
   */
  function clear() {
    history.value.length = 1
    redoStack.value.length = 0
  }

  /**
   * 充值 source 为 last
   */
  function reset() {
    _setState()
  }

  /**
   * 设置 source 的值为最新值 last
   */
  function _setState() {
    const value = parse(last.value.snapshot)
    setSource(source, value)
    source.value = value
  }

  return {
    undoStack,
    redoStack,
    history,
    canRedo,
    canUndo,
    last,
    commit,
    undo,
    redo,
    clear,
    reset,
  }
}
