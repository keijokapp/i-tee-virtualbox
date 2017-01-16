import vboxmanageService from './vboxmanage';

export default async function(name, property, value) {
	value = value === null || value === undefined ? '' : value;
	await vboxmanageService('setextradata', name, property, value);
}
