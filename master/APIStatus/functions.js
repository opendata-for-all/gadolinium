let fs = require('fs');
let path = require('path');

let getAPIStatus = () => {
	let APIStatus = fs.readFileSync(path.join(__dirname, 'APIStatus.json'));
	return JSON.parse(APIStatus).APIStatus;
};

let writeAPIStatus = (data) => {
	let APIStatus = {APIStatus : data};
	updateAPIProgress(APIStatus);
	APIStatus = JSON.stringify(APIStatus);
	fs.writeFileSync(path.join(__dirname, 'APIStatus.json'), APIStatus);
};

let updateAPIProgress = (APIStatus) => {
	Object.values(APIStatus.APIStatus).map((api) => {
		api.progress = (Object.values(api.servers)).reduce((accum, server) => {
			return accum + server.progress;
		}, 0);
		api.totalProgress = (Object.values(api.servers)).reduce((accum, server) => {
			return accum + server.totalProgress;
		}, 0);
	})
};

module.exports = {
	getAPIStatus: getAPIStatus,
	writeAPIStatus: writeAPIStatus
};