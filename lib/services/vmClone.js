import vboxmanageService from './vboxmanage';

export default async function(name, image, snapshot) {
	if(snapshot) {
		await vboxmanageService('clonevm', image,
			'--snapshot', snapshot,
			'--name', name,
			'--options', 'link',
			'--register');
	} else {
		await vboxmanageService('clonevm', image,
			'--name', name,
			'--register');
	}
}
