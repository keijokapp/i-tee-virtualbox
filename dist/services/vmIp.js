'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _common = require('../common');

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const regex = /^Name: \/VirtualBox\/GuestInfo\/Net\/([0-9]+)\/V4\/IP, value: ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+), timestamp: [0-9]+, flags: $/mg;

exports.default = async function (name) {
	const stdout = await (0, _vboxmanage2.default)('guestproperty', 'enumerate', name, '--patterns', '/VirtualBox/GuestInfo/Net/*/V4/IP');

	const ips = {};

	let m;
	while (m = regex.exec(stdout)) {
		ips[m[1]] = m[2];
	}

	_common.logger.debug('Machine IP-s', {
		machine: name,
		ips
	});

	return ips;
};