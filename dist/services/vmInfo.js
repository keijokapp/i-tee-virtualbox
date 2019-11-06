"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _common = require("../common");

var _vboxmanage = _interopRequireDefault(require("./vboxmanage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function _default(name) {
  const stdout = await (0, _common.lockMachine)(name, () => (0, _vboxmanage.default)('showvminfo', name, '--machinereadable'));
  const vmInfo = {};

  for (const line of stdout.split('\n')) {
    const index = line.indexOf('=');

    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index);

    try {
      vmInfo[key] = JSON.parse(line.slice(index + 1));
    } catch (e) {// ignored intentionally
    }
  }

  _common.logger.debug('Machine state', {
    machine: name,
    state: vmInfo['VMState'],
    'rdp-port': vmInfo['vrdeport'],
    'snapshot': vmInfo['CurrentSnapshotName']
  });

  const ret = {
    id: name,
    uuid: vmInfo['UUID'],
    state: vmInfo['VMState']
  };

  if ('vrdeport' in vmInfo && vmInfo['vrdeport'] > 0) {
    ret['rdp-port'] = vmInfo['vrdeport'];
  }

  if ('CurrentSnapshotName' in vmInfo) {
    ret.snapshot = vmInfo['CurrentSnapshotName'];
  }

  return ret;
}