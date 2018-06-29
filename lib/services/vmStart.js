import vboxmanageService from './vboxmanage';

export default async function(name, failOnRunning) {
	try {
		await vboxmanageService('startvm', name, '--type', 'headless');
	} catch(e) {
		if(failOnRunning || !e.message.includes('is already locked by a session')) {
			throw e;
		}
	}
}
