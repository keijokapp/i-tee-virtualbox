'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (name, username, password) {
	if (password !== undefined && password !== null) {
		const hash = _crypto2.default.createHash('sha256');
		hash.end(password);
		const passwordHash = hash.read().toString('hex');
		await (0, _vboxmanage2.default)('setextradata', name, 'VBoxAuthSimple/users/' + username, passwordHash);
	} else {
		await (0, _vboxmanage2.default)('setextradata', name, 'VBoxAuthSimple/users/' + username);
	}
};