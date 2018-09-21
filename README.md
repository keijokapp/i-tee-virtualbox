This application provides minimal REST API for [I-Tee](https://github.com/magavdraakon/i-tee). It uses `vboxmange` command to read and manipulate VirtualBox state. 


# Installation


**Note:** Systemd development files need to be installed before installation to make Systemd notifications work. Otherwise installation gives an error regarding to `sd-notify` which can be ignored if Systemd notifications are not needed.

```
npm i -g https://github.com/keijokapp/i-tee-virtualbox

i-tee-virtualbox --port 3000 --token access-token
```

Command line options

| Option  | Descriotion |
|---------|-------------|
| `--help` | Help text |
| `--address address` | IP address to listen on |
| `--port port` | TCP port to listen on |
| `--systemd` | Flag to indicate usage of Systemd socket |
| `--token access-token` | Access token; may be specidied multiple times |

`--port` or `--systemd` options are required. More than one Systemd socket is supported.


# API Specification


## Authorization

If specified on command line, access token is read and authorized according to [RFC6750](https://tools.ietf.org/html/rfc6750). All endpoints require authorization in that case.


## List machines


	GET /machine


### Parameters

| Name     | Type   | Description |
|----------|--------|-------------|
| running  | string | **optional** Query flag to only include running machines |
| detailed | string | **optional** Query flag to include details in response |
| ip       | string | **optional** Query flag to include IP-s in response |
| filter   | string | **optional** Regular expression to filter machines |


## Retrieve information about machine


	GET /machine/:machine


### Parameters

| Name    | Type   | Description |
|---------|--------|-------------|
| machine | string | Machine name |
| ip      | string | **optional** Query flag to include IP-s in response |


## Change state of machine


	PUT /machine/:machine


### Parameters

| Name          | Type     | Description |
|---------------|----------|-------------|
| machine       | string   | Machine name |
| ip            | string   | **optional** Query flag to include IP-s in response |
| image         | string   | **optional** Template name used to create macine if it does not exist |
| groups        | string[] | **optional** Groups to put machine into |
| networks      | object[] | **optional** Objects and/or strings (**deprecated**) describing networks to be assigned to NIC-s |
| networks.type | string   | Network type: 'bridged' or 'intnet' |
| networks.name | string   | Network name |
| dmi           | object   | **optional** DMI properties in `dmidecode` format |
| rdp-username  | string   | **optional** RDP username |
| rdp-password  | string   | **optional** RDP password |
| state         | string   | **optional** State of the machine |


If either `rdp-username` or `rdp-password` is specified, RDP connection will be reset. If only one of them is specified, no RDP user will be set. This is quite illogical behaviour which might change in the future.


## Halt and delete machine


	DELETE /machine/:machine


### Parameters

| Name    | Type   | Description |
|---------|--------|-------------|
| machine | string | Machine name |


## Create snapshot


	POST /machine/:machine/snapshot/:snapshot


### Parameters

| Name | Type | Description |
|-- ---|------|-------------|
| machine | object | Machine name |
| snapshot | object | Snapshot name |


## Delete snapshot


	DELETE /machine/:machine/snapshot/:snapshot


### Parameters

| Name | Type | Description |
|------|------|-------------|
| machine | string | Machine name |
| snapshot | string | Snapshot name |
