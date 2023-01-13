import path from 'path'

const root = process.cwd()

export const normalizePath = (p: string) =>
  path.posix.normalize(p.replace(/\\/g, '/'))

export const relative4Root = (p: string, dir = root) =>
  normalizePath(path.relative(dir, p))

export const toAbsolutePath = (p: string, dir = root) => path.resolve(dir, p)
