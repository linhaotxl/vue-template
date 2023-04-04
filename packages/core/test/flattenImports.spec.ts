import { describe, test, expect } from 'vitest'

import { flattenImports } from '../src/core/ctx'

describe('flattenImports', () => {
  test('vue', () => {
    expect(flattenImports('vue')).toMatchInlineSnapshot(`
      [
        {
          "as": "inject",
          "from": "vue",
          "name": "inject",
        },
        {
          "as": "h",
          "from": "vue",
          "name": "h",
        },
      ]
    `)
  })

  test('vue array', () => {
    expect(flattenImports(['vue'])).toMatchInlineSnapshot(`
      [
        {
          "as": "inject",
          "from": "vue",
          "name": "inject",
        },
        {
          "as": "h",
          "from": "vue",
          "name": "h",
        },
      ]
    `)
  })

  test('custom package', () => {
    expect(flattenImports({ vue: [['inject', 'i']] })).toMatchInlineSnapshot(`
      [
        {
          "as": "i",
          "from": "vue",
          "name": "inject",
        },
      ]
    `)
  })

  test('not found', () => {
    // @ts-ignore
    expect(() => flattenImports('a')).toThrowError(
      `[auto-import] preset a not found`
    )
  })

  test('disable overriding', () => {
    expect(() => flattenImports(['vue', { vue: ['inject'] }])).toThrowError(
      `[auto-import] identifier inject already defined with vue`
    )
  })

  test('allow overriding', () => {
    expect(flattenImports(['vue', { vue: [['inject', 'i']] }], true))
      .toMatchInlineSnapshot(`
      [
        {
          "as": "i",
          "from": "vue",
          "name": "inject",
        },
        {
          "as": "h",
          "from": "vue",
          "name": "h",
        },
      ]
    `)
  })

  test('allow overriding', () => {
    expect(flattenImports([{ vue: [['inject', 'i']] }, 'vue'], true))
      .toMatchInlineSnapshot(`
      [
        {
          "as": "inject",
          "from": "vue",
          "name": "inject",
        },
        {
          "as": "h",
          "from": "vue",
          "name": "h",
        },
      ]
    `)
  })
})
