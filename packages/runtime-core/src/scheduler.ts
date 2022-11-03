export interface SchedulerJob extends Function {
  /**
   * 任务 id，越小优先级越高，优先级越高就越先执行
   */
  id?: number

  /**
   * 是否是 pre 任务
   */
  pre?: boolean

  /**
   * 是否允许递归调用自己
   */
  allowRecurse?: boolean

  /**
   * 是否处于激活状态，设置为 false 任务不会执行
   */
  active?: boolean
}

const resolvePromise = Promise.resolve()
let currentPromise: Promise<void> | null = null

// 主任务队列
const queue: (SchedulerJob | null)[] = []
// 遍历主任务队列的索引
let flushIndex = -1

// post 任务队列
const pendingPostFlushCbs: SchedulerJob[] = []
// 当前正在遍历的 post 队列
let activePostFlushCbs: SchedulerJob[] = []
// 遍历 post 队列的索引
let postFlushIndex = -1

/**
 * 主任务入队
 * @param job
 */
export function queueJob(job: SchedulerJob) {
  if (!queue.length || job.allowRecurse || !queue.includes(job)) {
    if (job.id == null) {
      queue.push(job)
    } else {
      const insert = findInsertionIndex(job.id)
      queue.splice(insert, 0, job)
    }
  }

  queueFlush()
}

/**
 * post 任务入队
 * @param cb
 */
export function queuePostFlushCb(cb: SchedulerJob | SchedulerJob[]) {
  if (Array.isArray(cb)) {
    // 数组直接 push
    pendingPostFlushCbs.push(...cb)
  } else {
    // 非数组
    // 如果 job 允许递归调用则 push，否则检查 job 是否处于正在遍历的队列中
    if (
      !activePostFlushCbs.length ||
      cb.allowRecurse ||
      !activePostFlushCbs.includes(cb)
    ) {
      pendingPostFlushCbs.push(cb)
    }
  }

  queueFlush()
}

let isFlushing = false
let isFlushPending = false

/**
 * 准备开始刷新队列
 */
function queueFlush() {
  if (!isFlushPending && !isFlushing) {
    isFlushPending = true
    // 将 flushJobs 放进微任务队列，并将返回的新 Promise 存储在 currentPromise 中
    // 这样在 nextTick 中可以监听 currentPromise 的 then 或 catch 来捕获异常
    // currentPromise 是可以捕获到 reoslvePromise 抛出的异常
    currentPromise = resolvePromise.then(flushJobs)
  }
}

/**
 * 刷新所有任务队列
 */
function flushJobs() {
  isFlushPending = false
  isFlushing = true

  // 对所有任务进行排序
  queue.sort(comparator)

  try {
    // 执行每个主任务，主任务激活时才可以执行
    for (flushIndex = 0; flushIndex < queue.length; ++flushIndex) {
      const job = queue[flushIndex]
      if (job && job.active !== false) {
        job()
      }
    }
  } finally {
    // 执行完成后，或者 job 中抛出异常

    // 清空主任务列表
    queue.length = 0
    flushIndex = 0

    // 刷新 post 任务，post 任务中可能又会生成新的主任务或者 post 任务，检测是否产生新的任务再次刷新
    flushPostFlushCbs()
    if (pendingPostFlushCbs.length || queue.length) {
      flushJobs()
    }

    // 所有任务刷新完成后，恢复刷新标识
    isFlushing = false
    postFlushIndex = -1
    // 恢复激活的 promise
    currentPromise = null
  }
}

/**
 * 刷新 pre 队列
 */
export function flushPreFlushCbs() {
  // 从当前主 job 开始遍历，检测每个 job 是否是 pre job，如果是就执行，执行之后将其置空
  // 等到当前 job 执行完成继续向后执行时，就不会重复执行 pre job 了
  for (let i = flushIndex + 1; i < queue.length; ++i) {
    const job = queue[i]
    if (job && job.pre) {
      job()
      queue[i] = null
    }
  }
}

/**
 * 刷新 post 队列
 */
export function flushPostFlushCbs() {
  // post 队列去重，并存储在 active 中，接着清空原始队列
  // 如果在遍历过程中又产生了新的主任务或 post 任务，则只会进入到原始队列中
  // 之后会检测原始队列是否还存在任务重新刷新
  if (pendingPostFlushCbs.length) {
    activePostFlushCbs = [...new Set(pendingPostFlushCbs)].sort(
      comparatorPostCb
    )
    pendingPostFlushCbs.length = 0
  }

  for (
    postFlushIndex = 0;
    postFlushIndex < activePostFlushCbs.length;
    ++postFlushIndex
  ) {
    const cb = activePostFlushCbs[postFlushIndex]
    cb()
  }

  activePostFlushCbs.length = 0
}

/**
 * 下一个微任务
 * @param fn
 * @returns
 */
export function nextTick(fn?: () => void) {
  const p = currentPromise || resolvePromise
  if (fn) {
    return p.then(fn)
  }
  return p
}

/**
 * 获取任务优先级，越小优先级越高
 * @param job
 * @returns
 */
function getId(job: SchedulerJob): number {
  return typeof job.id === 'number' ? job.id : Infinity
}

/**
 * 查找 id 需要插入的位置
 * @param id
 * @returns
 */
function findInsertionIndex(id: number) {
  for (let i = 0; i < queue.length; ++i) {
    const job = queue[i]
    if (job) {
      // 过滤没有 id 的 job
      if (job.id == null) {
        continue
      }

      // id 越小，优先级越高(插入到越靠前的位置)
      // id 相同，
      if (job.id >= id) {
        return i
      }
    }
  }

  return queue.length
}

/**
 * 主任务排序函数
 * @param a
 * @param b
 * @returns
 */
export function comparator(
  a: SchedulerJob | null,
  b: SchedulerJob | null
): number {
  if (!a || !b) {
    return 0
  }
  return getId(a) - getId(b)
}

/**
 * post 任务排序函数
 * @param a
 * @param b
 * @returns
 */
function comparatorPostCb(a: SchedulerJob, b: SchedulerJob) {
  return getId(a) - getId(b)
}

/**
 * 使指定 job 无效，只能用于主 job
 * @param job
 */
export function invalidateJob(job: SchedulerJob) {
  const index = queue.indexOf(job)
  // 只会将正在执行 job 之后的 job 失效，失效当前或者之前的 job 没有意义
  if (index > flushIndex) {
    queue[index] = null
  }
}
