import { defineConfig, presetAttributify, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],

  theme: {
    colors: {
      primary: 'var(--primary-color)',
      dark: 'var(--dark-bg)',
    },
  },

  shortcuts: [
    [
      'icon-btn',
      'text-16 inline-block cursor-pointer opacity-75 select-none transition duration-200 ease-in-out hover:text-primary',
    ],
    ['flex-center', 'flex justify-center items-center'],
    [
      'card-shadow',
      [
        {
          'box-shadow':
            '0 1px 2px -2px #00000029, 0 3px 6px #0000001f, 0 5px 12px 4px #00000017',
        },
      ],
    ],
  ],
})
