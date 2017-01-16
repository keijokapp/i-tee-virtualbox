import vboxmanageService from './vboxmanage';

export default async function(name, failOnStopped) {
	try {
		await vboxmanageService('controlvm', name, 'poweroff');
	} catch(e) {
		if(failOnStopped && !~e.message.indexOf('VBoxManage: error: Machine \'' + name + '\' is not currently running\n'))
			throw e;
	}
}
