import vboxmanageService from './vboxmanage';

export default async function(name, failOnStopped) {
	try {
		await vboxmanageService('controlvm', name, 'poweroff');
	} catch(e) {
		if(failOnStopped || !e.message.includes('is not currently running')) {
			throw e;
		}
	}
}
