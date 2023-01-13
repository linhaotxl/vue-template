import fs from 'fs'

export const readFile = (p: string) => fs.readFileSync(p, 'utf-8')

export const writeFile = (file: string, data: string) =>
  fs.writeFileSync(file, data, 'utf-8')

export const mkdir = (dir: string) => fs.mkdirSync(dir, { recursive: true })
