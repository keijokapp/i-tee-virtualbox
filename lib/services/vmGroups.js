import vboxmanageService from './vboxmanage';

export default async function(name, groups) {
	await vboxmanageService('modifyvm', name, '--groups', groups.join(','));
}
