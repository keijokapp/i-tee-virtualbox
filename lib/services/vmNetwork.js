import vboxmanageService from './vboxmanage';

export default async function(name, slot, network) {

	slot++; // slot indices are 1-based

	try {
		await Promise.all([
			await vboxmanageService('modifyvm', name, '--nic' + slot, 'intnet'),
			await vboxmanageService('modifyvm', name, '--intnet' + slot, network)
		]);
	} catch(e) {
		if(e.message.includes('is already locked for a session')) {
			await vboxmanageService('controlvm', name, 'nic' + slot, 'intnet', network)
		} else {
			throw e;
		}
	}
}
