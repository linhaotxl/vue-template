import { readFile, readFileSync } from 'fs'
import path, { resolve } from 'path'

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
      skipPackageJson: true,
    })
    expect(resolved).toBe(getRealPath(index))
  })

  test('resolve dictionary index file2', () => {
    const dict = path.resolve(process.cwd(), 'src')
    const index = path.join(dict, 'index.ts')
    const resolved = tryResolveFile(dict, '', {
      tryIndex: true,
      extensions: ['.ts', '.js'],
      skipPackageJson: true,
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
      skipPackageJson: true,
    })
    expect(resolved).toBe(getRealPath(index))
  })

  test('resolve dictionary include #', () => {
    const dict = path.resolve(process.cwd(), 'src/#')
    const index = path.resolve(process.cwd(), 'src/#/index.ts')
    const resolved = tryFsResolve(dict, {
      tryIndex: true,
      extensions: ['.js', '.ts'],
      skipPackageJson: true,
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
      skipPackageJson: true,
    })
    expect(resolved).toBe(getRealPath(index))
  })

  test('resolve await-to-js entry point', () => {
    const awaitToJsDir = path.resolve(process.cwd(), 'node_modules/await-to-js')
    const res = tryFsResolve(awaitToJsDir, {
      tryIndex: true,
      skipPackageJson: false,
    })

    const content = readFileSync(res!, 'utf-8')
    expect(content).toMatch('function to')
  })

  test('resolve browser field', () => {
    const browserDict = path.resolve(process.cwd(), './browser-field')
    const resolved = tryFsResolve(browserDict, {
      tryIndex: true,
      skipPackageJson: false,
      targetWeb: true,
    })
    const content = readFileSync(resolved!, 'utf-8')
    expect(content).toMatch('success')
  })

  test('resolve browser and module', () => {
    const browserDict = path.resolve(process.cwd(), './browser-module-field1')
    const resolved = tryFsResolve(browserDict, {
      tryIndex: true,
      skipPackageJson: false,
      targetWeb: true,
    })
    const content = readFileSync(resolved!, 'utf-8')
    expect(content).toMatch('success')
  })

  test('resolve browser and module', () => {
    const browserDict = path.resolve(process.cwd(), './browser-module-field2')
    const resolved = tryFsResolve(browserDict, {
      tryIndex: true,
      skipPackageJson: false,
      targetWeb: true,
    })
    const content = readFileSync(resolved!, 'utf-8')
    expect(content).toMatch('success')
  })

  test('resolve browser and module', () => {
    const browserDict = path.resolve(process.cwd(), './browser-module-field3')
    const resolved = tryFsResolve(browserDict, {
      tryIndex: true,
      skipPackageJson: false,
      targetWeb: true,
    })
    const content = readFileSync(resolved!, 'utf-8')
    expect(content).toMatch('success')
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
