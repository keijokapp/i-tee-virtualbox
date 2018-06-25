import vboxmanageService from './vboxmanage';

export default async function(name, failOnRunning) {
	try {
		await vboxmanageService('startvm', name, '--type', 'headless');
	} catch(e) {
		if(failOnRunning || (!~e.message.indexOf('VBoxManage: error: The machine \'' + name + '\' is already locked by a session (or being locked or unlocked)\n') && !~e.message.indexOf('VBoxManage: error: Machine \'' + name + '\' is already locked by a session\n')))
			throw e;
	}
}
