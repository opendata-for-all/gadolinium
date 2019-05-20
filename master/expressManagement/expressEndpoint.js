let OpenAPIJSONParser = require('../Parsers/OpenAPIJSONParser');
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
		res.render('index', {
			title: "I'm a master !",
			zoneList : listOfServers
		})
	});
};

let createOpenAPIJSONEndpoint = (app) => {
	app.post('/OpenAPI', async (req, res, next) => {
		let newApi = {};
		let openAPIJSON = req.body;
		try {
			let httpRequest = await OpenAPIJSONParser.parse(openAPIJSON);
			newApi.host = openAPIJSON.host;
			newApi.httpRequests = httpRequest;
			console.log(newApi);
			res.status(200).send({
				message: "The file is correct"
			});
			addAPIToAPIStatus(newApi);
			socketFunc.emitAPIStatusUpdate();
		} catch (e) {
			res.status(400).send(e.message);
		}
	})
};

let addAPIToAPIStatus = (newApi) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	let id = Object.keys(APIStatus).length + 1;
	APIStatus[id] = {
		name : newApi.host,
		httpRequests : newApi.httpRequests,
		servers : {}
	};
	APIStatusFunc.writeAPIStatus(APIStatus);
};

module.exports = {
	createEndpoints: createEndpoints
}