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
				e.args = args;
				if (e.message.includes('Could not find a registered machine named') || e.message.includes('Could not find a registered machine with UUID')) {
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