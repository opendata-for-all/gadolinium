let fs = require('fs');
let path = require('path');

let getAPIStatus = () => {
	let APIStatus = fs.readFileSync(path.join(__dirname, 'APIStatus.json'));
	return JSON.parse(APIStatus).APIStatus;
};

let writeAPIStatus = (data) => {
	let APIStatus = JSON.stringify({APIStatus : data});
	fs.writeFileSync(path.join(__dirname, 'APIStatus.json'), APIStatus);
};

module.exports = {
	getAPIStatus: getAPIStatus,
	writeAPIStatus: writeAPIStatus
};