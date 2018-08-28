'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _vboxmanage = require('./vboxmanage');

var _vboxmanage2 = _interopRequireDefault(_vboxmanage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let lockPromise = Promise.resolve();

exports.default = async function (name, failOnRunning) {
	lockPromise = lockPromise.catch(() => {
		// ignored intentionally
	}).then(async () => {
		try {
			await (0, _vboxmanage2.default)('startvm', name, '--type', 'headless');
		} catch (e) {
			if (failOnRunning || !e.message.includes('is already locked by a session')) {
				throw e;
			}
		}
	});

	return lockPromise;
};