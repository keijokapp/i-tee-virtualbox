import vboxmanageService from './vboxmanage';

export default async function(name, slot, type, network) {

	if(!['intnet', 'bridged'].includes(type)) {
		throw new Error('Unknown network type \'' + type + '\'');
	}

	slot++; // slot indices are 1-based

	try {
		await Promise.all([
			await vboxmanageService('modifyvm', name, '--nic' + slot, type),
			await vboxmanageService('modifyvm', name, '--' + (type === 'bridged' ? 'bridgeadapter' : type) + slot, network)
		]);
	} catch(e) {
		if(e.message.includes('is already locked for a session')) {
			await vboxmanageService('controlvm', name, 'nic' + slot, type, network);
		} else {
			throw e;
		}
	}
}
