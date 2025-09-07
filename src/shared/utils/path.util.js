const trim = require('lodash/trim');
const path = require('path');

const SRC_PATH = path.resolve(__dirname, '../..');
const isDev = process.env.NODE_ENV === 'development';

function isAlphanumeric(mixedVar) {
  return /number|string/i.test(typeof mixedVar);
}

function pathify(p) {
  if (!isAlphanumeric(p)) {
    return '';
  }

  const absPath = trim(`${p}`);
  if (absPath.length === 0) {
    return '';
  }

  return path.normalize(absPath);
}

function generatePath(...paths) {
  return pathify(
    paths
      .filter(isAlphanumeric)
      .map((p) => trim(`${p}`))
      .filter((t) => t.length > 0)
      .join(path.sep),
  );
}

function getResourcePath(...paths) {
  if (isDev) {
    return generatePath(SRC_PATH, ...paths);
  }
  return generatePath(process.resourcesPath, ...paths);
}

function getPublicPath(...paths) {
  if (isDev) {
    return generatePath(SRC_PATH, '../public', ...paths);
  }
  return generatePath(process.resourcesPath, '../public', ...paths);
}

module.exports = {
  generatePath,
  getResourcePath,
  getPublicPath
};
 