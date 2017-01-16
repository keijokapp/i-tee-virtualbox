import vboxmanageService from './vboxmanage';

export default async function(name, enabled) {
	await vboxmanageService('controlvm', name, 'vrde', enabled ? 'on' : 'off');
}
