import path from 'path'

const generatedContentVirtualFile = '@generated-content-virtual-file'
const generatedContentImports = [
  {
    specifer: path
      .resolve(__dirname, './drive-relative.js')
      .replace(/^[a-zA-Z]:/, ''),
    elementQuery: '.drive-relative',
  },
]

export default {
  plugins: [
    {
      name: 'generated-content',
      resolveId(id: string) {
        console.log('id: ', id)
        if (id === generatedContentVirtualFile) {
          console.log(111)
          return id
        }
      },

      load(id: string) {
        if (id === generatedContentVirtualFile) {
          console.log(222)
          const code = generatedContentImports.map(
            ({ specifer, elementQuery }, i) =>
              `import content${i} from ${JSON.stringify(specifer)}\n` +
              `text(${JSON.stringify(elementQuery)}, content${i})`
          )

          return `
            function text (selector, text) {
              document.querySelector(selector).textContent = text
            }

          `.trim()
        }
      },
    },
  ],
}
