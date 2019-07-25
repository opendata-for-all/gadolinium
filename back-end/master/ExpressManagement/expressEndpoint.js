const fileUpload = require('express-fileupload');
const path = require('path');

let OpenAPIJSONParser = require('../Parsers/OpenAPIJSONParser');
let PetStoreParser = require('../Parsers/PetStoreParser');
let GoogleCloudManagement = require('../GoogleCloudManagement/functions');
let APIStatusFunc = require('../APIStatus/functions');
let socketFunc = require('../SocketServerManagement/socketServerCreationAndConnection');
let socketSlaveManagement = require('../SocketServerManagement/socketServerSlaveManagement');
let listOfServers = null;

let getListOfServers = async () => {
	if (listOfServers) return listOfServers;
	else listOfServers = GoogleCloudManagement.getListOfZones();
};

getListOfServers();

let createEndpoints = (app) => {
	createDefaultEndpoint(app);
	createOpenAPIJSONEndpoint(app);
	createOpenAPIExportEndpoint(app);
};

let createDefaultEndpoint = (app) => {
	app.get('/', async (req, res, next) => {
		res.sendFile('index.html');
	});
};

let createOpenAPIJSONEndpoint = (app) => {
	app.post('/OpenAPI', fileUpload(), async (req, res, next) => {
		let newApi = {};
		try {
			const openAPIJSON = JSON.parse(req.files.file.data.toString('utf8'));
			let httpRequest;
			if (openAPIJSON.host === 'petstore.swagger.io') {
				httpRequest = await PetStoreParser.parse(openAPIJSON);
			} else {
				httpRequest = await OpenAPIJSONParser.parse(openAPIJSON);
			}
			newApi.host = openAPIJSON.host;
			newApi.httpRequests = httpRequest;
			let newApiId = await APIStatusFunc.addApi(newApi);
			socketFunc.emitAPIStatusUpdate();
			res.status(200).send({
				message: "The file is correct",
				apiId: newApiId
			});
		} catch (e) {
			res.send({status: 400, message: e.message});
		}
	});

	app.post('/OpenAPIJsonValidation', fileUpload(), async (req, res) => {
		try {
			const formData = JSON.parse(req.files.file.data.toString('utf8'));
			res.send({
				isValid: await OpenAPIJSONParser.isValidOpenAPIJson(formData)
			})
		} catch (e) {
			res.send({isValid: false})
		}
	});
};

let createOpenAPIExportEndpoint = (app) => {
	app.get('/APIStatus', (req, res) => {
		res.sendFile(path.join(__dirname, '../APIStatus/', 'APIStatus.json'));
	});

	app.get('/OpenAPIExport/:apiId', (req, res) => {
		let apiId = req.params.apiId;
		res.sendFile(path.join(__dirname, '../APIStatus/openapi-' + apiId + '.zip'));
	})
};

module.exports = {
	createEndpoints: createEndpoints
};
