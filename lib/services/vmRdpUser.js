import crypto from 'crypto';
import vboxmanageService from './vboxmanage';

export default async function(name, username, password) {
	if(password !== undefined && password !== null) {
		const hash = crypto.createHash('sha256');
		hash.end(password);
		const passwordHash = hash.read().toString('hex');
		await vboxmanageService('setextradata', name, 'VBoxAuthSimple/users/' + username, passwordHash);
	} else {
		await vboxmanageService('setextradata', name, 'VBoxAuthSimple/users/' + username);
	}
}
