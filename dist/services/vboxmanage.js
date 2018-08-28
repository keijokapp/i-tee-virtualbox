'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _child_process = require('child_process');

var _common = require('../common');

exports.default = async function (...args) {
	return new Promise((resolve, reject) => {
		(0, _child_process.execFile)('vboxmanage', args, (e, stdout) => {
			if (e) {
				_common.logger.error('VirtualBox error', { args: args, error: e.message });
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
};