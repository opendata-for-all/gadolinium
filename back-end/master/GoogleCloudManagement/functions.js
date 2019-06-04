let path = require('path');
let regionList = require('./regionList');

let getGoogleAuth = async () => {
	const {auth} = require('google-auth-library');
	const client = await auth.getClient({
		scopes: [
			'https://www.googleapis.com/auth/cloud-platform',
			'https://www.googleapis.com/auth/compute',
			'https://www.googleapis.com/auth/compute.readonly',
		],
		keyFilename: path.join(__dirname, 'GCPKeyFile.json')
	});
	return {auth, client};
};

// createVM(zone, name, sourceInstanceTemplate)
// 	.then(console.log)
// 	.catch(console.error);

const createVM = async (zone, vmName) => {
	let {auth, client} = await getGoogleAuth();
	const templateName = `gadolinium-template`;
	const projectId = await auth.getProjectId();

	const sourceInstanceTemplate = `projects/${projectId}/global/instanceTemplates/${templateName}`;
	const url = `https://www.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/instances?sourceInstanceTemplate=${sourceInstanceTemplate}`;

	return await client.request({
		url: url,
		method: 'post',
		data: {name: vmName}
	});
};

const deleteVM = async (zone, vmName) => {
	let {auth, client} = await getGoogleAuth();
	const projectId = await auth.getProjectId();

	const url = `https://www.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/instances/${vmName}`;

	try{
		return await client.request({
			url: url,
			method: 'delete',
			data: {name: vmName}
		});
	} catch (e) {
		return {
			status : e.code,
			errors : e.errors
		};
	}
};
function getListOfZones() {
	return regionList;
}

module.exports = {
	createVM: createVM,
	deleteVM : deleteVM,
	getListOfZones: getListOfZones
};