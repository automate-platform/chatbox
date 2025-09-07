const { getResourcePath, getPublicPath } = require('../shared/utils/path.util')
const logger = require('electron-log')

const nrLogLevels = {
  // eslint-disable-line no-unused-vars
  10: 'error',
  20: 'error',
  30: 'warn',
  40: 'info',
  50: 'debug',
  60: 'debug',
  98: 'debug',
  99: 'debug',
}

const getSettings = async () => {
  return {
    flowFile: getResourcePath('node-red', 'flows', 'init.json'),
    flowFilePretty: true,
    userDir: getPublicPath('node-red'),
    nodesDir: getPublicPath('node-red'),
    uiPort: 1883,
    uiHost: process.env.NODERED_HOST || '127.0.0.1',
    // adminAuth: {
    //     type: "credentials",
    //     users: [
    //         {
    //             username: "admin",
    //             password: "$2a$12$ymZoWlnp/D1dL74gOPXB5eTgi2IJfNlc.L8ExASa1T5BjcgKN8YHO",
    //             permissions: "*"
    //         }
    //     ]
    // },
    diagnostics: {
      enabled: true,
      ui: true,
    },
    runtimeState: {
      enabled: false,
      ui: false,
    },
    logging: {
      console: {
        level: 'info',
        handler: () => {
          return function (msg) {
            nrLogLevels[msg.level] &&
              logger[nrLogLevels[msg.level]] &&
              logger[nrLogLevels[msg.level]](`[NODE-RED]`, msg.name ? `[${msg.name}]` : '', msg.msg)
          }
        },
      },
    },
    exportGlobalContextKeys: false,
    externalModules: {},
    editorTheme: {
      projects: {
        enabled: false,
        workflow: {
          mode: 'manual',
        },
      },

      codeEditor: {
        lib: 'monaco',
        options: {},
      },

      markdownEditor: {
        mermaid: {
          enabled: true,
        },
      },

      multiplayer: {
        enabled: false,
      },
    },
    functionExternalModules: true,
    functionGlobalContext: {},
    functionTimeout: 0,
    debugMaxLength: 1000,
    mqttReconnectTime: 15000,
    serialReconnectTime: 15000,
    httpAdminRoot: '/',
    httpNodeRoot: '/',
  }
}

module.exports = { getSettings }
