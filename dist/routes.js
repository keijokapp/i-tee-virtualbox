"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _safeRegex = _interopRequireDefault(require("safe-regex"));

var _expressJsonschema = require("express-jsonschema");

var _express = require("express");

var _constants = require("./constants");

var _util = require("./util");

var _common = require("./common");

var _vmList = _interopRequireDefault(require("./services/vmList"));

var _vmClone = _interopRequireDefault(require("./services/vmClone"));

var _vmExtraData = _interopRequireDefault(require("./services/vmExtraData"));

var _vmInfo = _interopRequireDefault(require("./services/vmInfo"));

var _vmIp = _interopRequireDefault(require("./services/vmIp"));

var _vmGroups = _interopRequireDefault(require("./services/vmGroups"));

var _vmNetwork = _interopRequireDefault(require("./services/vmNetwork"));

var _vmStart = _interopRequireDefault(require("./services/vmStart"));

var _vmPoweroff = _interopRequireDefault(require("./services/vmPoweroff"));

var _vmDelete = _interopRequireDefault(require("./services/vmDelete"));

var _vmRdpUser = _interopRequireDefault(require("./services/vmRdpUser"));

var _vmRdp = _interopRequireDefault(require("./services/vmRdp"));

var _vmSnapshot = _interopRequireDefault(require("./services/vmSnapshot"));

var _vmAcpiPowerButton = _interopRequireDefault(require("./services/vmAcpiPowerButton"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const router = new _express.Router();
var _default = router;
/**
 * @api {get} /machine List machines
 * @apiGroup Machine
 * @apiParam {string} [running] Query flag to only include running machines
 * @apiParam {string} [detailed] Query flag to include details in response
 * @apiParam {string} [ip] Query flag to include IP-s in response
 * @apiParam {string} [filter] Regular expression to filter machines
 * @apiSuccess {object[]} - machine Array of machine objects
 * @apiSuccess {string} id ID (name) of the machine
 * @apiSuccess {string} uuid UUID of the machine
 * @apiSuccess {object} state State of the machine
 * @apiSuccess {string} [snapshot] Current snapshot name
 * @apiSuccess {number} [rdp-port] RDP port if machine is running
 * @apiSuccess {string[]} [ip] IP-s of machine if requested
 */

exports.default = _default;
router.get('/machine', (0, _util.asyncMiddleware)(async (req, res) => {
  const running = 'running' in req.query;
  const machines = await (0, _vmList.default)(running);

  if ('filter' in req.query) {
    try {
      if (!(0, _safeRegex.default)(req.query.filter)) {
        res.status(400).send({
          error: 'Bad request',
          message: 'Given filter is considered unsafe'
        });
        return;
      }

      const regex = new RegExp(req.query.filter); // in-place filtering algorithm from https://stackoverflow.com/a/37319954

      let i = 0,
          j = 0;
      const l = machines.length;

      while (i < l) {
        const machine = machines[i];

        if (machine.id.match(regex)) {
          machines[j++] = machine;
        }

        i++;
      }

      machines.length = j;
    } catch (e) {
      if (e instanceof SyntaxError) {
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

  if (wantDetails || wantIps) {
    const promises = machines.map(async ({
      id
    }, i) => {
      if (wantDetails) {
        const info = await (0, _vmInfo.default)(id);

        for (const j in info) {
          machines[i][j] = info[j];
        }
      }

      if (wantIps) {
        machines[i].ip = await (0, _vmIp.default)(id);
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
 * @apiParam {any[]} [networks] Objects and/or strings describing networks to be assigned to NIC-s
 * @apiParam {string} networks.type Network type: 'bridged' or 'intnet'
 * @apiParam {string} networks.name Network name
 * @apiParam {object} [dmi] DMI properties in `dmidecode` format
 * @apiParam {string} [rdp-username] RDP username
 * @apiParam {string} [rdp-password] RDP password
 * @apiParam {string} [state] State of the machine
 * @apiSuccess {string} id ID (name) of the machine
 * @apiSuccess {string} uuid UUID of the machine
 * @apiSuccess {number} [rdp-port] RDP port if machine was started
 * @apiSuccess {string[]} [ip] IP-s of machine if requested
 */

router.put('/machine/:machine', (0, _expressJsonschema.validate)({
  body: {
    type: 'object',
    properties: {
      dmi: {
        type: 'object'
      },
      image: {
        type: 'string'
      },
      groups: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      networks: {
        type: 'array',
        items: {
          oneOf: [{
            type: 'string'
          }, {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['bridged', 'intnet']
              },
              name: {
                type: 'string',
                minLength: 1
              }
            }
          }]
        }
      },
      'rdp-username': {
        type: 'string'
      },
      'rdp-password': {
        type: 'string'
      },
      state: {
        type: 'string'
      }
    },
    additionalProperties: false
  }
}), (0, _util.asyncMiddleware)(async (req, res) => {
  const name = req.params.machine;

  async function doStuffWithMachine() {
    if ('dmi' in req.body) {
      for (const propertyName in req.body.dmi) {
        const vboxPropertyName = _constants.dmiExtraData[propertyName];

        if (!vboxPropertyName) {
          _common.logger.warn('Failed to lookup DMI property name: ' + propertyName);

          continue;
        }

        await (0, _vmExtraData.default)(name, vboxPropertyName, req.body.dmi[propertyName]);
      }
    }

    if ('rdp-username' in req.body || `rdp-password` in req.body) {
      await (0, _vmRdp.default)(name, false);
      await (0, _vmRdp.default)(name, true);
    }

    if ('rdp-username' in req.body && 'rdp-password' in req.body) {
      _common.logger.debug('Setting RDP user', {
        machine: name,
        'rdp-username': req.body['rdp-username'],
        'rdp-password': req.body['rdp-password']
      });

      await (0, _vmRdpUser.default)(name, req.body['rdp-username'], req.body['rdp-password']);
    }

    if ('groups' in req.body) {
      await (0, _vmGroups.default)(name, req.body.groups);
    }

    if ('networks' in req.body) {
      for (let i = 0; i < req.body.networks.length; i++) {
        const network = req.body.networks[i];

        if (typeof network === 'string') {
          await (0, _vmNetwork.default)(name, i, 'intnet', network);
        } else {
          await (0, _vmNetwork.default)(name, i, network.type, network.name);
        }
      }
    }

    if ('state' in req.body) {
      switch (req.body.state) {
        case 'poweroff':
          await (0, _vmPoweroff.default)(name, false);
          break;

        case 'stopping':
          await (0, _vmPoweroff.default)(name, true);
          break;

        case 'running':
          await (0, _vmStart.default)(name, false);
          break;

        case 'starting':
          await (0, _vmStart.default)(name, true);
          break;

        case 'acpipowerbutton':
          await (0, _vmAcpiPowerButton.default)(name, false);
          break;

        default:
          _common.logger.warn('Bad machine state requested: ' + req.body.state);

      }
    }

    const info = await (0, _vmInfo.default)(name);

    if ('ip' in req.query) {
      info.ip = await (0, _vmIp.default)(name);
    }

    return info;
  }

  try {
    var vmInfo = await doStuffWithMachine();
  } catch (e) {
    if (e.vboxError !== 'Not found') {
      throw e;
    }

    if (!('image' in req.body)) {
      res.status(400).send({
        error: 'Bad request',
        message: 'Image name must be given in case of non-existing machine'
      });
      return;
    }

    const image = req.body.image;
    const imageInfo = await (0, _vmInfo.default)(image);

    _common.logger.debug('Cloning machine', {
      machine: name,
      image,
      snapshot: imageInfo['snapshot']
    });

    if ('snapshot' in imageInfo) {
      await (0, _vmClone.default)(name, image, imageInfo['snapshot']);
    } else {
      await (0, _vmClone.default)(name, image);
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
 * @apiSuccess {string} id ID (name) of the machine
 * @apiSuccess {string} uuid UUID of the machine
 * @apiSuccess {string} state State of the machine
 * @apiSuccess {string} [snapshot] Current snapshot name
 * @apiSuccess {number} [rdp-port] RDP port if machine is running
 * @apiSuccess {string[]} [ip] IP-s of machine if requested
 */

router.get('/machine/:machine', (0, _util.asyncMiddleware)(async (req, res) => {
  const name = req.params.machine;

  try {
    const vmInfo = await (0, _vmInfo.default)(name);

    if ('ip' in req.query) {
      vmInfo.ip = await (0, _vmIp.default)(name);
    }

    res.send(vmInfo);
  } catch (e) {
    if (e.vboxError === 'Not found') {
      res.status(404).send({
        error: 'Not found'
      });
    } else {
      throw e;
    }
  }
}));
/**
 * @api {delete} /machine/:machine Halt and delete machine
 * @apiGroup Machine
 * @apiParam {string} machine Machine name
 */

router.delete('/machine/:machine', (0, _util.asyncMiddleware)(async (req, res) => {
  const name = req.params.machine;

  try {
    await (0, _vmPoweroff.default)(name, false);
    await (0, _vmDelete.default)(name);
    res.send({});
  } catch (e) {
    if (e.vboxError === 'Not found') {
      res.status(404).send({
        error: 'Not found'
      });
    } else {
      throw e;
    }
  }
}));
/**
 * @api {post} /machine/:machine/snapshot/:snapshot Create new snapshot
 * @apiGroup Snapshot
 * @apiParam {object} machine Machine name
 * @apiParam {object} snapshot Snapshot name
 */

router.post('/machine/:machine/snapshot/:snapshot', (0, _util.asyncMiddleware)(async (req, res) => {
  const name = req.params.machine;
  const snapshot = req.params.snapshot;

  try {
    await (0, _vmSnapshot.default)(name, snapshot);
    res.send({});
  } catch (e) {
    if (e.vboxError === 'Not found') {
      res.status(404).send({
        error: 'Not found'
      });
    } else {
      throw e;
    }
  }
}));
/**
 * @api {delete} /machine/:machine/snapshot/:snapshot Delete snapshot
 * @apiGroup Snapshot
 * @apiParam {string} machine Machine name
 * @apiParam {string} snapshot Snapshot name
 */

router.delete('/machine/:machine/snapshot/:snapshot', (0, _util.asyncMiddleware)(async (req, res) => {
  const name = req.params.machine;
  const snapshot = req.params.snapshot;

  try {
    (0, _vmSnapshot.default)(name, snapshot, false);
    res.send({});
  } catch (e) {
    if (e.vboxError === 'Not found') {
      res.status(404).send({
        error: 'Not found'
      });
    } else {
      throw e;
    }
  }
}));