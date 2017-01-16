import vboxmanageService from './vboxmanage';

export default async function(name) {
	await vboxmanageService('unregistervm', name, '--delete');
}
