"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _child_process = require("child_process");

var _common = require("../common");

async function _default(...args) {
  return new Promise((resolve, reject) => {
    (0, _child_process.execFile)('vboxmanage', args, (e, stdout) => {
      if (e) {
        e.args = args;

        if (~e.message.indexOf('Could not find a registered machine named')) {
          e.vboxError = 'Not found';
        } else {
          e.vboxError = 'Hypervisor error';
        }

        reject(e);
      } else {
        resolve(stdout);
      }
    });
  });
}