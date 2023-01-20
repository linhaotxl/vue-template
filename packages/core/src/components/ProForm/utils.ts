import type { ElColProps, NormalizeColProps } from './interface'

/**
 * 将 col 的配置格式为 ElColProps
 * @param col
 * @returns
 */
export const normalizeCol = (
  col: number | ElColProps | undefined
): ElColProps => {
  return isUndefined(col) ? { span: 24 } : isNumber(col) ? { span: col } : col
}

/**
 * 格式化 Form、FormItem 的 col 配置，包括响应式字段的配置
 * @param size
 * @param colProps
 */
export const normalizeFormCol = (
  size: ElColProps | number | undefined,
  colProps: NormalizeColProps
) => {
  if (isNumber(size)) {
    colProps.span = size
  } else if (isObject(size)) {
    size.span && (colProps.span = size.span)
    size.offset && (colProps.offset = size.offset)
    size.push && (colProps.push = size.push)
    size.pull && (colProps.pull = size.pull)

    if (size.xs) {
      normalizeFormCol(size.xs, (colProps.xs ||= {}))
    }

    if (size.sm) {
      normalizeFormCol(size.sm, (colProps.sm ||= {}))
    }

    if (size.md) {
      normalizeFormCol(size.md, (colProps.md ||= {}))
    }

    if (size.xl) {
      normalizeFormCol(size.xl, (colProps.xl ||= {}))
    }

    if (size.lg) {
      normalizeFormCol(size.lg, (colProps.lg ||= {}))
    }
  }
}

export const colRanges: ('xs' | 'sm' | 'md' | 'xl' | 'lg')[] = [
  'xs',
  'sm',
  'md',
  'xl',
  'lg',
]

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number'

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isUndefined = (value: unknown): value is undefined =>
  typeof value === 'undefined'

const hanOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (obj: unknown, v: PropertyKey) =>
  hanOwnProperty.call(obj, v)
