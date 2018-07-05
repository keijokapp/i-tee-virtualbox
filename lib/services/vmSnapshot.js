import vboxmanageService from './vboxmanage';

export default async function(name, snapshotName, create) {
	// FIXME: should deletion be in separate service?
	if(arguments.length < 3) {
		create = true;
	}
	await vboxmanageService('snapshot', name, create ? 'take' : 'delete', snapshotName);
}
