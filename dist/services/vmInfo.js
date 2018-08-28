'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _common = require('../common');

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (name) {
	const stdout = await (0, _vboxmanage2.default)('showvminfo', name, '--machinereadable');
	const vmInfo = {};
	for (const line of stdout.split('\n')) {
		const index = line.indexOf('=');
		if (index === -1) {
			continue;
		}
		const key = line.slice(0, index);
		try {
			vmInfo[key] = JSON.parse(line.slice(index + 1));
		} catch (e) {
			// ignored intentionally
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
};