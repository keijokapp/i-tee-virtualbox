"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _vboxmanage = _interopRequireDefault(require("./vboxmanage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let lockPromise = Promise.resolve();

async function _default(name, failOnRunning) {
  lockPromise = lockPromise.catch(() => {// ignored intentionally
  }).then(async () => {
    try {
      await (0, _vboxmanage.default)('startvm', name, '--type', 'headless');
    } catch (e) {
      if (failOnRunning || !e.message.includes('is already locked by a session')) {
        throw e;
      }
    }
  });
  return lockPromise;
}