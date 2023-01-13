import { existsSync } from 'fs'

export function tryResolve(filePath: string, extensions: string[]) {
  if (existsSync(filePath)) {
    return filePath
  }

  for (const ext of extensions) {
    const file = `${filePath}${ext}`
    if (existsSync(file)) {
      return file
    }
  }
}
