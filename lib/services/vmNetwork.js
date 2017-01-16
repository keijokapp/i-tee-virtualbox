import vboxmanageService from './vboxmanage';

export default async function(name, slot, network) {

	slot++; // slot indices are 1-based

	await Promise.all([
		await vboxmanageService('modifyvm', name, '--nic' + slot, 'intnet'),
		await vboxmanageService('modifyvm', name, '--intnet' + slot, network)
	]);
}
