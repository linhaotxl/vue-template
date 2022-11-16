import { capitalize } from '@vue/shared'

export function toHandlers(events: Record<string, Function>) {
  const result: Record<string, Function> = {}

  for (const name in events) {
    result[`on${capitalize(name)}`] = events[name]
  }

  return result
}
