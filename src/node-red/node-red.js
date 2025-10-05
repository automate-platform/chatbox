const http = require('http');
const Module = require('module');
const path = require('path');

const express = require('express');
const RED = require('node-red');

const logger = require('electron-log');
const { getSettings } = require('./config');

const redApp = express();
const server = http.createServer(redApp);

const isDev = process.env.NODE_ENV === 'development';

async function startNodeRed() {
  // Thêm đường dẫn node_modules trong app.asar vào module search paths
  if (!isDev) {
    const asarNodeModulesPath = path.join(
      __dirname,
      '..',
      'resources',
      'app.asar',
      'node_modules'
    );
    Module.globalPaths.push(asarNodeModulesPath);
  } else {
    const asarNodeModulesPath = path.join(__dirname, '..', 'node_modules');
    Module.globalPaths.push(asarNodeModulesPath);
  }

  const nodeRedSettings = await getSettings();

  RED.init(server, nodeRedSettings);

  const _run = RED.runtime._.exec.run;

  RED.runtime._.exec.run = function (command, args, options, emit) {
    return _run(command, args, options, emit);
  };

  // Serve the editor UI from /red
  redApp.use(nodeRedSettings.httpAdminRoot, RED.httpAdmin);
  // Serve the http nodes UI from /api
  redApp.use(nodeRedSettings.httpNodeRoot, RED.httpNode);

  await RED.start()
    .then(() => {
      server.listen(
        process.env.NODERED_PORT || 1883,
        process.env.NODERED_HOST || '127.0.0.1'
      );
      logger.info("NODERED started")
    })
    .catch((e) => {
      logger.error(e);
    });

  return RED;
}
function getNodeRed() {
  return RED
}
module.exports = startNodeRed;
module.exports.getNodeRed = getNodeRed;
 