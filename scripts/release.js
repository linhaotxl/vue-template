import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

import chalk from 'chalk'
import enquirer from 'enquirer'
import { execa } from 'execa'
import minimist from 'minimist'
import semver from 'semver'

const args = minimist(process.argv.slice(2))

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取当前版本
const currentVersion = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
).version

// 对当前版本进行不同类型的递增
const inc = i => semver.inc(currentVersion, i)

/**
 * 执行脚本
 * @param {*} bin 执行命令
 * @param {*} args 参数
 * @param {*} opts
 * @returns
 */
const run = (bin, args, opts) => execa(bin, args, { stdio: 'inherit', ...opts })

const step = msg => console.log(chalk.cyan(msg))

const resolveRoot = (...p) => path.resolve(__dirname, '..', ...p)

const packages = fs.readdirSync(resolveRoot('packages'))
console.log('packages: ', packages)

// console.log('packages: ', packages)
// console.log(args)

// 需要发布的版本类型
const versionIncrements = ['patch', 'minor', 'major']

// 自定义版本类型
const CUSTOM_SELECT_VERSION = 'custom'

async function main() {
  // 获取命令行中指定发布的版本
  // pnpm release 0.0.1
  let targetVersion = args._[0]

  // 选择/自定义发布的版本
  if (!targetVersion) {
    const { release } = await enquirer.prompt({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements
        .map(type => `${type} (${inc(type)})`)
        .concat(CUSTOM_SELECT_VERSION),
    })

    if (release === CUSTOM_SELECT_VERSION) {
      const { version } = await enquirer.prompt({
        type: 'input',
        name: 'version',
        message: 'Input custom version',
        initial: currentVersion,
      })

      targetVersion = version
    } else {
      targetVersion = release.match(/\((.+)\)/)?.[1]
    }

    // console.log('release: ', release)
  }

  // 校验版本是否合法
  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version ${targetVersion}`)
  }

  // 确认发布
  const { yes: confirmRelease } = await enquirer.prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm?`,
  })

  if (!confirmRelease) {
    return
  }

  console.log('targetVersion: ', targetVersion)

  // 更新内部依赖版本
  step('\nUpdating cross dependencies...')
  updateVersions(targetVersion)

  // build
  // step('\nBuilding all packages...')
  // await run('pnpm', ['run', 'build'])

  // changelog

  // git
  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await run('git', ['add', '-A'])
    await run('git', ['commit', '-m', `release: v${targetVersion}`])
  } else {
    console.log('No changes to commit.')
  }

  // publish

  // push to github
  step('\nPushing to Github...')
  await run('git', ['tag', `v${targetVersion}`])
  await run('git', ['push', 'origin', `refs/tags/${targetVersion}`])
  await run('git', ['push'])

  console.log('giff: ', stdout)
}

main()

function updateVersions(version) {
  udpatePackage(resolveRoot(), version)
  packages.forEach(packageName => {
    udpatePackage(resolveRoot('packages', packageName), version)
  })
}

/**
 * 更新 package.json 文件中的版本信息
 * @param {*} pkgDir package.json 文件所在目录
 * @param {*} version 需要更新的版本号
 */
function udpatePackage(pkgDir, version) {
  const pkgPath = path.resolve(pkgDir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version

  updateDeps(pkg, version, 'dependencies')

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

function updateDeps(pkg, version, type) {
  const deps = pkg[type]
  if (!deps) {
    return
  }

  Object.keys(deps).forEach(dep => {
    if (isCorePackage(dep) && deps[dep] !== 'workspace:*') {
      deps[dep] = version
      console.log(chalk.yellow(`${pkg.name} -> ${type} -> ${dep}@${version}`))
    }
  })
}

function isCorePackage(name) {
  if (!name) {
    return false
  }

  if (name.startsWith('auto-import-shared')) {
    return true
  }

  return false
}

/**
 * name
 * depend: {
 *
 * }
 */
