"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lockMachine = lockMachine;
exports.logger = void 0;

var _winston = _interopRequireDefault(require("winston"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = _winston.default.createLogger({
  format: _winston.default.format.combine(_winston.default.format.timestamp(), _winston.default.format.simple()),
  transports: [new _winston.default.transports.Console({
    level: 'debug'
  })]
});

exports.logger = logger;
const machineLocks = {};

async function lockMachine(name, callback) {
  const promise = Promise.resolve(machineLocks[name]).then(callback);
  machineLocks[name] = promise.catch(e => {});
  return await promise;
}