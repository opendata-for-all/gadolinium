let OpenAPIJSONParser = require('../Parsers/OpenAPIJSONParser');
let PetStoreParser = require('../Parsers/PetStoreParser');
let FakeAPIParser = require('../Parsers/FakeAPIParser');
let GoogleCloudManagement = require('../GoogleCloudManagement/functions');
let APIStatusFunc = require('../APIStatus/functions');
let socketFunc = require('../socketServerManagement/socketServerCreationAndConnection');
let listOfServers = null;

let getListOfServers = async () => {
	if (listOfServers) return listOfServers;
	else listOfServers = GoogleCloudManagement.getListOfZones();
};

getListOfServers();

let createEndpoints = (app) => {
	createDefaultEndpoint(app);
	createOpenAPIJSONEndpoint(app);
};

let createDefaultEndpoint = (app) => {
	app.get('/', async (req, res, next) => {
		res.sendFile('index.html');
	});
};

let createOpenAPIJSONEndpoint = (app) => {
	app.post('/OpenAPI', async (req, res, next) => {
		let newApi = {};
		let openAPIJSON = req.body;
		try {
			const openAPIJSON = JSON.parse(req.files.file.data.toString('utf8'));
			let httpRequest;
			if (openAPIJSON.host === 'petstore.swagger.io') {
				httpRequest = await PetStoreParser.parse(openAPIJSON);
			} else if (openAPIJSON.host === 'localhost:8082') {
				httpRequest = await FakeAPIParser.parse(openAPIJSON);
			} else if (openAPIJSON.host === 'stevenbucaille.com') {
				httpRequest = await FakeAPIParser.parse(openAPIJSON);
			} else {
				httpRequest = await OpenAPIJSONParser.parse(openAPIJSON);
			}
			newApi.host = openAPIJSON.host;
			newApi.httpRequests = httpRequest;
			let newApiId = await APIStatusFunc.addApi(newApi);
			socketFunc.emitAPIStatusUpdate();
			res.status(200).send({
				message: "The file is correct"
			});
		} catch (e) {
			res.send({status : 400, message : e.message});
		}
	})
};

module.exports = {
	createEndpoints: createEndpoints
}
