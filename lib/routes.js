import safe from 'safe-regex';
import { validate } from 'express-jsonschema';
import { Router } from 'express';
import { dmiExtraData } from './constants';
import { asyncMiddleware } from './util';
import { logger } from './common';
import vmListService from './services/vmList';
import vmCloneService from './services/vmClone';
import vmExtraDataService from './services/vmExtraData';
import vmInfoService from './services/vmInfo';
import vmIpService from './services/vmIp';
import vmGroupsService from './services/vmGroups';
import vmNetworkService from './services/vmNetwork';
import vmStartService from './services/vmStart';
import vmPoweroffService from './services/vmPoweroff';
import vmDeleteService from './services/vmDelete';
import vmRdpUserService from './services/vmRdpUser';
import vmRdpService from './services/vmRdp';
import vmSnapshotService from './services/vmSnapshot';


const router = new Router;
export default router;


/**
 * @api {get} /machine List machines
 * @apiGroup Machine
 * @apiParam {string} [running] Query flag to only include running machines
 * @apiParam {string} [detailed] Query flag to include details in response
 * @apiParam {string} [ip] Query flag to include IP-s in response
 * @apiParam {string} [filter] Regular expression to filter machines
 * @apiSuccess {object[]} - machine Array of machine objects
 * @apiSuccess {string} id ID (name) of the machine
 * @apiSuccess {object} state State of the machine
 * @apiSuccess {string} [snapshot] Current snapshot name
 * @apiSuccess {number} [rdp-port] RDP port if machine is running
 * @apiSuccess {string[]} [ip] IP-s of machine if requested
 */
router.get('/machine', asyncMiddleware(async (req, res) => {
	const running = 'running' in req.query;
	const machines = (await vmListService(running)).map(m => ({ id: m }));

	if('filter' in req.query) {
		try {

			if(!safe(req.query.filter)) {
				res.status(400).send({
					error: 'Bad request',
					message: 'Given filter is considered unsafe'
				});
				return;
			}

			const regex = new RegExp(req.query.filter);
			// in-place filtering algorithm from https://stackoverflow.com/a/37319954
			let i = 0, j = 0;
			const l = machines.length;
			while (i < l) {
				const machine = machines[i];
				if(machine.id.match(regex)) {
					machines[j++] = machine;
				}
				i++;
			}
			machines.length = j;
		} catch(e) {
			if(e instanceof SyntaxError) {
				res.status(400).send({
					error: 'Bad request',
					message: 'Filter is not valid regular expression'
				});
				return;
			}
			throw e;
		}
	}

	const wantDetails = 'detailed' in req.query;
	const wantIps = 'ip' in req.query;

	if(wantDetails || wantIps) {
		const promises = machines.map(async ({id}, i) => {
			if(wantDetails) {
				const info = await vmInfoService(id);
				for(const j in info) {
					machines[i][j] = info[j];
				}
			}

			if(wantIps) {
				machines[i].ip = await vmIpService(id);
			}

		});
		await Promise.all(promises);
	}

	res.send(machines);
}));


/**
 * @api {put} /machine/:machine Change state of machine
 * @apiGroup Machine
 * @apiParam {string} [ip] Query flag to include IP-s in response
 * @apiParam {string} machine Machine name
 * @apiParam {string} [image] Template name used to create macine if it does not exist
 * @apiParam {string[]} [groups] Groups to pot machine into
 * @apiParam {string[]} [networks] Networks to be assigned to NIC-s
 * @apiParam {object} [dmi] DMI properties in `dmidecode` format
 * @apiParam {object} [rdp-username] RDP username
 * @apiParam {object} [rdp-password] RDP password
 * @apiParam {string} [state] State of the machine
 * @apiSuccess {number} [rdp-port] RDP port if machine was started
 * @apiSuccess {string[]} [ip] IP-s of machine if requested
 */
router.put('/machine/:machine', validate({
	body: {
		type: "object",
		properties: {
			dmi: { type: "object" },
			image: { type: "string" },
			groups: {
				type: "array",
				items: { type: "string" }
			},
			networks: {
				type: "array",
				items: { type: "string" }
			},
			'rdp-username': { type: "string" },
			'rdp-password': { type: "string" },
			state: { type: "string" }
		},
		additionalProperties: false
	}
}), asyncMiddleware(async(req, res) => {

	const name = req.params.machine;

	async function doStuffWithMachine() {
		if('dmi' in req.body) {
			for(const propertyName in req.body.dmi) {
				const vboxPropertyName = dmiExtraData[propertyName];
				if(!vboxPropertyName) {
					logger.warn('Failed to lookup DMI property name: ' + propertyName);
					continue;
				}
				await vmExtraDataService(name, vboxPropertyName, req.body.dmi[propertyName]);
			}
		}

		if('rdp-username' in req.body || `rdp-password` in req.body) {
			await vmRdpService(name, false);
			await vmRdpService(name, true);
		}

		if('rdp-username' in req.body && 'rdp-password' in req.body) {
			logger.debug('Setting RDP user', {
				machine: name,
				'rdp-username': req.body['rdp-username'],
				'rdp-password': req.body['rdp-password']
			});
			await vmRdpUserService(name, req.body['rdp-username'], req.body['rdp-password']);
		}

		if('groups' in req.body) {
			await vmGroupsService(name, req.body.groups);
		}

		if('networks' in req.body) {
			for(let i = 0; i < req.body.networks.length; i++) {
				await vmNetworkService(name, i, req.body.networks[i]);
			}
		}

		if('state' in req.body) {
			switch(req.body.state) {
				case 'poweroff':
					await vmPoweroffService(name, false);
					break;
				case 'stopping':
					await vmPoweroffService(name, true);
					break;
				case 'running':
					await vmStartService(name, false);
					break;
				case 'starting':
					await vmStartService(name, true);
					break;
				default:
					logger.warn('Bad machine state requested: ' + req.body.state);
			}
		}

		const info = await vmInfoService(name);
		if('ip' in req.query) {
			info.ip = await vmIpService(name);
		}
		return info;
	}

	try {
		var vmInfo = await doStuffWithMachine();
	} catch(e) {
		if(e.vboxError !== 'Not found') {
			throw e;
		}

		if(!('image' in req.body)) {
			res.status(400).send({
				error: 'Bad request',
				message: 'Image name must be given in case of non-existing machine'
			});
			return;
		}

		const image = req.body.image;
		const imageInfo = await vmInfoService(image);

		logger.debug('Cloning machine', { machine: name, image, snapshot: imageInfo['snapshot'] });
		if('snapshot' in imageInfo) {
			await vmCloneService(name, image, imageInfo['snapshot']);
		} else {
			await vmCloneService(name, image);
		}

		vmInfo = await doStuffWithMachine();
	}

	res.send(vmInfo);
}));


/**
 * @api {get} /machine/:machine Retrieve information about machine
 * @apiGroup Machine
 * @apiParam {string} machine Machine name
 * @apiParam {string} [ip] Query flag to include IP-s in response
 * @apiSuccess {string} state State of the machine
 * @apiSuccess {string} [snapshot] Current snapshot name
 * @apiSuccess {number} [rdp-port] RDP port if machine is running
 * @apiSuccess {string[]} [ip] IP-s of machine if requested
 */
router.get('/machine/:machine', asyncMiddleware(async(req, res) => {
	const name = req.params.machine;
	const vmInfo = await vmInfoService(name);
	if('ip' in req.query) {
		vmInfo.ip = await vmIpService(name);
	}
	res.send(vmInfo);
}));


/**
 * @api {delete} /machine/:machine Halt and delete machine
 * @apiGroup Machine
 * @apiParam {string} machine Machine name
 */
router.delete('/machine/:machine', asyncMiddleware(async(req, res) => {
	const name = req.params.machine;

	await vmPoweroffService(name, false);
	await vmDeleteService(name);

	res.send({});
}));


/**
 * @api {post} /machine/:machine/snapshot/:snapshot Create new snapshot
 * @apiGroup Snapshot
 * @apiParam {object} machine Machine name
 * @apiParam {object} snapshot Snapshot name
 */
router.post('/machine/:machine/snapshot/:snapshot', asyncMiddleware(async(req, res) => {

	const name = req.params.machine;
	const snapshot = req.params.snapshot;

	await vmSnapshotService(name, snapshot);

	res.send({});
}));


/**
 * @api {delete} /machine/:machine/snapshot/:snapshot Delete snapshot
 * @apiGroup Snapshot
 * @apiParam {string} machine Machine name
 * @apiParam {string} snapshot Snapshot name
 */
router.delete('/machine/:machine/snapshot/:snapshot', asyncMiddleware(async(req, res) => {
	const name = req.params.machine;
	const snapshot = req.params.snapshot;

	vmSnapshotService(name, snapshot, false);

	res.send({});
}));

