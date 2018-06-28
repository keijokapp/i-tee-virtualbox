# i-tee-virtualbox v0.2.0

VirtualBox API provider for I-Tee

- [Machine](#machine)
	- [Halt and delete machine](#halt-and-delete-machine)
	- [List machines](#list-machines)
	- [Retrieve information about machine](#retrieve-information-about-machine)
	- [Change state of machine](#change-state-of-machine)
	
- [Snapshot](#snapshot)
	- [Delete snapshot](#delete-snapshot)
	- [Create new snapshot](#create-new-snapshot)
	


# Machine

## Halt and delete machine



	DELETE /machine/:machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| string			|  <p>Machine name</p>							|

## List machines



	GET /machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| running			| string			| **optional** <p>Query flag to only include running machines</p>							|
| detailed			| string			| **optional** <p>Query flag to include details in response</p>							|
| ip			| string			| **optional** <p>Query flag to include IP-s in response</p>							|
| filter			| string			| **optional** <p>Regular expression to filter machines</p>							|

## Retrieve information about machine



	GET /machine/:machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| string			|  <p>Machine name</p>							|
| ip			| string			| **optional** <p>Query flag to include IP-s in response</p>							|

## Change state of machine



	PUT /machine/:machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| ip			| string			| **optional** <p>Query flag to include IP-s in response</p>							|
| machine			| string			|  <p>Machine name</p>							|
| image			| string			| **optional** <p>Template name used to create macine if it does not exist</p>							|
| groups			| string[]			| **optional** <p>Groups to pot machine into</p>							|
| networks			| string[]			| **optional** <p>Networks to be assigned to NIC-s</p>							|
| dmi			| object			| **optional** <p>DMI properties in <code>dmidecode</code> format</p>							|
| rdp-username			| object			| **optional** <p>RDP username</p>							|
| rdp-password			| object			| **optional** <p>RDP password</p>							|
| state			| string			| **optional** <p>State of the machine</p>							|

# Snapshot

## Delete snapshot



	DELETE /machine/:machine/snapshot/:snapshot


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| string			|  <p>Machine name</p>							|
| snapshot			| string			|  <p>Snapshot name</p>							|

## Create new snapshot



	POST /machine/:machine/snapshot/:snapshot


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| object			|  <p>Machine name</p>							|
| snapshot			| object			|  <p>Snapshot name</p>							|


