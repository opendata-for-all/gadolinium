let APIStatus = null;
let gcpServers = null;
let apiSelected = null;
let serversSelected = [];
let testServersSelected = [];

let inputOpenAPIJSON = document.getElementById('openapijsonfile');

let sendOpenAPIJSONFileToMaster = async (json) => {
	let response = await fetch('/OpenAPI', {
		method: 'POST',
		headers: {
			"content-type": "application/json"
		},
		body: json
	});
	console.log(response);
};

let openFile = function (event) {
	let input = event.target;

	let reader = new FileReader();
	reader.onloadend = async function () {
		let text = reader.result;
		await sendOpenAPIJSONFileToMaster(text);
	};
	reader.readAsText(input.files[0]);
};

let getServerList = (apiId) => {
	client.emit('getServerList', apiId, (serverList) => {
		addServerlistToHTML(serverList);
		updateApiList(apiId, serverList);
	});
};

let updateAPIs = (newAPIStatus) => {
	let apisId = Object.keys(APIStatus);
	let newApiIds = Object.keys(newAPIStatus);
};

let isNewAPIStatusDifferent = (newAPIStatus) => {
	return !Object.compare(APIStatus, newAPIStatus);
};

let isAPIStatusInitialized = () => {
	return APIStatus !== null;
};

let client = io('/', {
	query: {
		token: "webclient"
	}
});
client.on('connection', function () {
	console.log("connected");
});
client.on('connected', function () {
	console.log("connected");
});
client.on('event', function (data) {
	console.log("event");
});
client.on('disconnect', function () {
	console.log("disconnected");
});

client.on('hello', function (data) {
	console.log(data);
});

client.on('APIStatus', function (data) {
	console.log("New APIStatus update");
	refreshAPIStatus(data);
});

client.on('newAPITest', function (data) {
	newAPITest(data);
});

client.on('serverUpdate', (data) => {
	let apiId = data.apiId;
	// apiList[apiId]
	if (isApiSelected(apiId)) {

	}
});

client.on('newServerToTest', (data) => {
	console.log(data);
})