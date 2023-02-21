import path from 'path'

import { describe, test, expect } from 'vitest'

import {
  getRealPath,
  splitFileAndPostfix,
  tryFsResolve,
  tryResolveFile,
} from '../../packages/vite/src/node/plugins/resolve'

describe('tryResolveFile', () => {
  test('resolve absolute file', () => {
    const file = path.resolve(process.cwd(), 'src/index.js')
    const resolved = tryResolveFile(file, '', {})
    expect(resolved).toBe(getRealPath(file))
  })

  test('resolve dictionary index file1', () => {
    const dict = path.resolve(process.cwd(), 'src')
    const index = path.join(dict, 'index.js')
    const resolved = tryResolveFile(dict, '', {
      tryIndex: true,
      extensions: ['.js', '.ts'],
    })
    expect(resolved).toBe(getRealPath(index))
  })

  test('resolve dictionary index file2', () => {
    const dict = path.resolve(process.cwd(), 'src')
    const index = path.join(dict, 'index.ts')
    const resolved = tryResolveFile(dict, '', {
      tryIndex: true,
      extensions: ['.ts', '.js'],
    })
    expect(resolved).toBe(getRealPath(index))
  })
})

describe('tryFsResolve', () => {
  test('file with query', () => {
    const file = path.resolve(process.cwd(), 'src/index.js?a=1')
    const resolved = tryFsResolve(file, {})
    expect(resolved).toBe(getRealPath(file))
  })

  test('resolve dictionary index file with query', () => {
    const dict = path.resolve(process.cwd(), 'src?a=1')
    const index = path.resolve(process.cwd(), 'src/index.js?a=1')
    const resolved = tryFsResolve(dict, {
      tryIndex: true,
      extensions: ['.js', '.ts'],
    })
    expect(resolved).toBe(getRealPath(index))
  })

  test('resolve dictionary include #', () => {
    const dict = path.resolve(process.cwd(), 'src/#')
    const index = path.resolve(process.cwd(), 'src/#/index.ts')
    const resolved = tryFsResolve(dict, {
      tryIndex: true,
      extensions: ['.js', '.ts'],
    })
    expect(resolved).toBe(getRealPath(index))
  })

  test('resolve file with prefix', () => {
    const index = path.resolve(process.cwd(), 'src/index.js?a=1')
    const file = path.resolve(process.cwd(), 'c?a=1')
    const resolved = tryFsResolve(file, {
      tryPrefix: 'sr',
      extensions: ['.js'],
      tryIndex: true,
    })
    expect(resolved).toBe(getRealPath(index))
  })
})

describe('splitFileAndPostfix', () => {
  test('without query or hash', () => {
    const id = path.resolve(process.cwd(), 'src/index.js')
    const { file, postfix } = splitFileAndPostfix(id)

    expect(file).toBe(id)
    expect(postfix).toBe('')
  })

  test('with query ', () => {
    const id = path.resolve(process.cwd(), 'src/index.js')
    const idWithQuery = `${id}?a=1`
    const { file, postfix } = splitFileAndPostfix(idWithQuery)

    expect(file).toBe(id)
    expect(postfix).toBe('?a=1')
  })

  test('with hash ', () => {
    const id = path.resolve(process.cwd(), 'src/index.js')
    const idWithQuery = `${id}#aaa`
    const { file, postfix } = splitFileAndPostfix(idWithQuery)

    expect(file).toBe(id)
    expect(postfix).toBe('#aaa')
  })

  test('with query and hash ', () => {
    const id = path.resolve(process.cwd(), 'src/index.js')
    const idWithQuery = `${id}?a=1#aaa`
    const { file, postfix } = splitFileAndPostfix(idWithQuery)

    expect(file).toBe(id)
    expect(postfix).toBe('?a=1#aaa')
  })
})
