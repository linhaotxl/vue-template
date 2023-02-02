/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
;(() => {
  // webpackBootstrap
  var __webpack_modules__ = {
    /***/ './src/index.js':
      /*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
      /***/ (
        __unused_webpack_module,
        __unused_webpack_exports,
        __webpack_require__
      ) => {
        eval(
          'const { print } = __webpack_require__(/*! ./info/info */ "./src/info/info.js")\n\n;(async () => {\n  console.log(\'入口文件: \', await print())\n})()\n\n\n//# sourceURL=webpack://webpack-example/./src/index.js?'
        )

        /***/
      },

    /***/ './src/info/age.js':
      /*!*************************!*\
  !*** ./src/info/age.js ***!
  \*************************/
      /***/ module => {
        eval(
          'module.exports = {\n  age: 24,\n}\n\n\n//# sourceURL=webpack://webpack-example/./src/info/age.js?'
        )

        /***/
      },

    /***/ './src/info/info.js':
      /*!**************************!*\
  !*** ./src/info/info.js ***!
  \**************************/
      /***/ (module, __unused_webpack_exports, __webpack_require__) => {
        eval(
          'const { age } = __webpack_require__(/*! ./age */ "./src/info/age.js")\n// const { name } = import(\'./name\')\n\nmodule.exports = {\n  async print() {\n    const { name } = await __webpack_require__.e(/*! import() | info */ "info").then(__webpack_require__.t.bind(__webpack_require__, /*! ./name */ "./src/info/name.js", 23))\n    return \'name is \' + name + \' and age is \' + age\n  },\n}\n// exports.info =\n\n\n//# sourceURL=webpack://webpack-example/./src/info/info.js?'
        )

        /***/
      },
  }
  /************************************************************************/
  // The module cache
  var __webpack_module_cache__ = {}

  // The require function
  function __webpack_require__(moduleId) {
    // Check if module is in cache
    var cachedModule = __webpack_module_cache__[moduleId]
    if (cachedModule !== undefined) {
      return cachedModule.exports
    }
    // Create a new module (and put it into the cache)
    var module = (__webpack_module_cache__[moduleId] = {
      // no module.id needed
      // no module.loaded needed
      exports: {},
    })

    // Execute the module function
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__)

    // Return the exports of the module
    return module.exports
  }

  // expose the modules object (__webpack_modules__)
  __webpack_require__.m =
    __webpack_modules__ /* webpack/runtime/create fake namespace object */

  /************************************************************************/
  ;(() => {
    var getProto = Object.getPrototypeOf
      ? obj => Object.getPrototypeOf(obj)
      : obj => obj.__proto__
    var leafPrototypes
    // create a fake namespace object
    // mode & 1: value is a module id, require it
    // mode & 2: merge all properties of value into the ns
    // mode & 4: return value when already ns object
    // mode & 16: return value when it's Promise-like
    // mode & 8|1: behave like require
    __webpack_require__.t = function (value, mode) {
      if (mode & 1) value = this(value)
      if (mode & 8) return value
      if (typeof value === 'object' && value) {
        if (mode & 4 && value.__esModule) return value
        if (mode & 16 && typeof value.then === 'function') return value
      }
      var ns = Object.create(null)
      __webpack_require__.r(ns)
      var def = {}
      leafPrototypes = leafPrototypes || [
        null,
        getProto({}),
        getProto([]),
        getProto(getProto),
      ]
      for (
        var current = mode & 2 && value;
        typeof current == 'object' && !~leafPrototypes.indexOf(current);
        current = getProto(current)
      ) {
        Object.getOwnPropertyNames(current).forEach(
          key => (def[key] = () => value[key])
        )
      }
      def['default'] = () => value
      __webpack_require__.d(ns, def)
      return ns
    }
  })() /* webpack/runtime/define property getters */
  ;(() => {
    // define getter functions for harmony exports
    __webpack_require__.d = (exports, definition) => {
      for (var key in definition) {
        if (
          __webpack_require__.o(definition, key) &&
          !__webpack_require__.o(exports, key)
        ) {
          Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key],
          })
        }
      }
    }
  })() /* webpack/runtime/ensure chunk */
  ;(() => {
    __webpack_require__.f = {}
    // This file contains only the entry chunk.
    // The chunk loading function for additional chunks
    __webpack_require__.e = chunkId => {
      return Promise.all(
        Object.keys(__webpack_require__.f).reduce((promises, key) => {
          __webpack_require__.f[key](chunkId, promises)
          return promises
        }, [])
      )
    }
  })() /* webpack/runtime/get javascript chunk filename */
  ;(() => {
    // This function allow to reference async chunks
    __webpack_require__.u = chunkId => {
      // return url for filenames based on template
      return '' + chunkId + '.js'
    }
  })() /* webpack/runtime/global */
  ;(() => {
    __webpack_require__.g = (function () {
      // eslint-disable-next-line no-undef
      if (typeof globalThis === 'object') return globalThis
      try {
        return this || new Function('return this')()
      } catch (e) {
        // eslint-disable-next-line no-undef
        if (typeof window === 'object') return window
      }
    })()
  })() /* webpack/runtime/hasOwnProperty shorthand */
  ;(() => {
    __webpack_require__.o = (obj, prop) =>
      Object.prototype.hasOwnProperty.call(obj, prop)
  })() /* webpack/runtime/load script */
  ;(() => {
    // 正在执行的
    // key: chunk 绝对路径，带有后缀 .js
    // value: 加载完成回调[]
    var inProgress = {}
    var dataWebpackPrefix = 'webpack-example:'
    // loadScript function to load a script via script tag
    /**
     *
     * @param {string} url chunk 绝对路径，带有后缀 .js
     * @param {*} done 完成回调
     * @param {*} key chunk 的 key: chunk-${chunkName}
     * @param {*} chunkId chunkName
     * @returns
     */
    __webpack_require__.l = (url, done, key, chunkId) => {
      if (inProgress[url]) {
        inProgress[url].push(done)
        return
      }
      var script, needAttach
      if (key !== undefined) {
        // eslint-disable-next-line no-undef
        var scripts = document.getElementsByTagName('script')
        for (var i = 0; i < scripts.length; i++) {
          var s = scripts[i]
          if (
            s.getAttribute('src') == url ||
            s.getAttribute('data-webpack') == dataWebpackPrefix + key
          ) {
            script = s
            break
          }
        }
      }
      if (!script) {
        needAttach = true
        // eslint-disable-next-line no-undef
        script = document.createElement('script')

        script.charset = 'utf-8'
        script.timeout = 120
        if (__webpack_require__.nc) {
          script.setAttribute('nonce', __webpack_require__.nc)
        }
        script.setAttribute('data-webpack', dataWebpackPrefix + key)
        script.src = url
      }

      // 记录 url 对应的 script 的完成回调
      inProgress[url] = [done]

      // script 加载完成，无论成功失败
      var onScriptComplete = (prev, event) => {
        // avoid mem leaks in IE.
        script.onerror = script.onload = null
        clearTimeout(timeout)
        var doneFns = inProgress[url]
        delete inProgress[url]
        script.parentNode && script.parentNode.removeChild(script)
        doneFns && doneFns.forEach(fn => fn(event))
        if (prev) return prev(event)
      }

      // 超过 120s 代表 script 超时加载
      var timeout = setTimeout(
        onScriptComplete.bind(null, undefined, {
          type: 'timeout',
          target: script,
        }),
        120000
      )

      // 绑定 script 的加载成功/失败事件
      script.onerror = onScriptComplete.bind(null, script.onerror)
      script.onload = onScriptComplete.bind(null, script.onload)
      // eslint-disable-next-line no-undef
      needAttach && document.head.appendChild(script)
    }
  })() /* webpack/runtime/make namespace object */
  ;(() => {
    // define __esModule on exports
    __webpack_require__.r = exports => {
      if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, {
          value: 'Module',
        })
      }
      Object.defineProperty(exports, '__esModule', { value: true })
    }
  })() /* webpack/runtime/publicPath */
  ;(() => {
    var scriptUrl
    if (__webpack_require__.g.importScripts)
      scriptUrl = __webpack_require__.g.location + ''
    var document = __webpack_require__.g.document
    if (!scriptUrl && document) {
      if (document.currentScript) scriptUrl = document.currentScript.src
      if (!scriptUrl) {
        var scripts = document.getElementsByTagName('script')
        if (scripts.length) scriptUrl = scripts[scripts.length - 1].src
      }
    }
    // When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
    // or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
    if (!scriptUrl)
      throw new Error('Automatic publicPath is not supported in this browser')
    scriptUrl = scriptUrl
      .replace(/#.*$/, '')
      .replace(/\?.*$/, '')
      .replace(/\/[^/]+$/, '/')
    __webpack_require__.p = scriptUrl
  })() /* webpack/runtime/jsonp chunk loading */
  ;(() => {
    // no baseURI

    // object to store loaded and loading chunks
    // undefined = chunk not loaded, null = chunk preloaded/prefetched
    // [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
    var installedChunks = {
      main: 0,
    }

    __webpack_require__.f.j = (chunkId, promises) => {
      // JSONP chunk loading for javascript
      // 查看是否已经 install 该 chunk
      var installedChunkData = __webpack_require__.o(installedChunks, chunkId)
        ? installedChunks[chunkId]
        : undefined
      if (installedChunkData !== 0) {
        // 0 means "already installed".

        // a Promise means "currently loading".
        if (installedChunkData) {
          promises.push(installedChunkData[2])
        } else {
          // all chunks have JS
          // setup Promise in chunk cache
          var promise = new Promise(
            (resolve, reject) =>
              (installedChunkData = installedChunks[chunkId] =
                [resolve, reject])
          )
          promises.push((installedChunkData[2] = promise))

          // start chunk loading
          var url = __webpack_require__.p + __webpack_require__.u(chunkId)
          // create error before stack unwound to get useful stacktrace later
          var error = new Error()
          var loadingEnded = event => {
            if (__webpack_require__.o(installedChunks, chunkId)) {
              installedChunkData = installedChunks[chunkId]
              if (installedChunkData !== 0) installedChunks[chunkId] = undefined
              if (installedChunkData) {
                var errorType =
                  event && (event.type === 'load' ? 'missing' : event.type)
                var realSrc = event && event.target && event.target.src
                error.message =
                  'Loading chunk ' +
                  chunkId +
                  ' failed.\n(' +
                  errorType +
                  ': ' +
                  realSrc +
                  ')'
                error.name = 'ChunkLoadError'
                error.type = errorType
                error.request = realSrc
                installedChunkData[1](error)
              }
            }
          }
          __webpack_require__.l(url, loadingEnded, 'chunk-' + chunkId, chunkId)
        }
      }
    }

    // no prefetching

    // no preloaded

    // no HMR

    // no HMR manifest

    // no on chunks loaded

    // install a JSONP callback for chunk loading
    var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
      var [chunkIds, moreModules, runtime] = data
      // add "moreModules" to the modules object,
      // then flag all "chunkIds" as loaded and fire callback
      var moduleId,
        chunkId,
        i = 0
      if (chunkIds.some(id => installedChunks[id] !== 0)) {
        for (moduleId in moreModules) {
          if (__webpack_require__.o(moreModules, moduleId)) {
            __webpack_require__.m[moduleId] = moreModules[moduleId]
          }
        }
        if (runtime) var result = runtime(__webpack_require__)
      }
      if (parentChunkLoadingFunction) parentChunkLoadingFunction(data)
      for (; i < chunkIds.length; i++) {
        chunkId = chunkIds[i]
        if (
          __webpack_require__.o(installedChunks, chunkId) &&
          installedChunks[chunkId]
        ) {
          installedChunks[chunkId][0]()
        }
        installedChunks[chunkId] = 0
      }
    }

    // eslint-disable-next-line no-undef
    var chunkLoadingGlobal = (self['webpackChunkwebpack_example'] =
      // eslint-disable-next-line no-undef
      self['webpackChunkwebpack_example'] || [])
    chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0))
    chunkLoadingGlobal.push = webpackJsonpCallback.bind(
      null,
      chunkLoadingGlobal.push.bind(chunkLoadingGlobal)
    )
  })()

  /************************************************************************/

  // startup
  // Load entry module and return exports
  // This entry module can't be inlined because the eval devtool is used.
  var __webpack_exports__ = __webpack_require__('./src/index.js')
})()
