import { execFile } from 'child_process';
import { logger } from '../common';

export default async function(...args) {
	return new Promise((resolve, reject) => {
		execFile('vboxmanage', args, (e, stdout) => {
			if(e) {
				e.args = args;
				if(e.message.includes('Could not find a registered machine named')
					|| e.message.includes('Could not find a registered machine with UUID')) {
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
