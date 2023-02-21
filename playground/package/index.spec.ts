import { describe, test, expect } from 'vitest'

import { resolvePackageData } from '../../packages/vite/src/node/packages'

describe('resolvePackageData', () => {
  test('resolve package', () => {
    const res = resolvePackageData('await-to-js', process.cwd())
    expect(res).toMatchObject({ data: { name: 'await-to-js' } })
  })

  test('resolve missing', () => {
    const res = resolvePackageData('a', process.cwd())
    expect(res).toBe(null)
  })
})
