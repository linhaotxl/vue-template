import vue from './vue'

export const presets = {
  vue: vue,
}

export type PresetName = keyof typeof presets
