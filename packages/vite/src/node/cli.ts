import { cac } from 'cac'

// import { resolveConfig } from './config'

const cli = cac('vite')

cli
  .option('-c, --config <file>', '[string] use specified config file')
  .option('-m, --mode <mode>', '[string] set env mode')

cli.command('[root]', 'start dev server').action(async (root: string) => {
  console.log('start success: ', root)
  const { createServer } = await import('./server')
  const server = await createServer({ root })

  // console.log(6, server)

  await server.listen(3000)
})

cli.help()

cli.parse()

// resolveConfig({}, 'serve')
