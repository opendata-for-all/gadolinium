let apisDom = {};
let serverDivsDom = {};
let serversDom = {};

let oldApi;
let newApi;

let submitServerForAPITest = () => {
	let gcpServerList = document.getElementById('GCPServers');
	let data = {
		apiId: apiSelected,
		regions: serversSelected
	};
	client.emit('newServerToTest', data);
	// prepareModalForServerSelection();
};

const collapseApis = apiId => {
	Object.values(apisDom).map((apiDiv) => {
		if (apiDiv.apiId === apiId) {
			$(apiDiv.collapseDiv).collapse('show');
		} else {
			$(apiDiv.collapseDiv).collapse('hide');
		}
	})
};

let clickOnApi = (apiId) => {
	collapseApis(apiId);
	apiSelected = apiId;
	makeAddServerButtonAppear();
	removeActiveClassFromAllApis();
	displaySelectedApiAsActive(apiId);
	displayServerList(apiId);
	getServerList(apiId);
};

const createTestButtonClicked = () => {
	let testServerSelection = document.getElementById('testServerSelection');
	let serverRegionsUsed = getServerRegionsUsedByCurrentApi();
	Array.from(testServerSelection.children).map((server) => {
		if (serverRegionsUsed.includes(server.getAttribute('gcpregion'))) {
			server.style.display = 'block';
		} else server.style.display = 'none';
	});
};

const getTestFormData = () => {
	return $('#testCreationForm').serializeArray()
};

const getServerIdFromRegion = (region) => {
	let serversId = Object.keys(APIStatus[apiSelected].servers);
	let servers = Object.values(APIStatus[apiSelected].servers);
	for (let i = 0; i < servers.length; i++) {
		if(servers[i].region === region) return serversId[i];
	}
};

const submitTestToServers = () => {
	let data = getTestFormData();
	console.log(data);
	let serversId = testServersSelected.map(getServerIdFromRegion);
	let testFormData = {
		apiId : apiSelected,
		serversId : serversId
	};
	client.emit('testForm', testFormData);
};

let apiTestServerSelected = (button) => {
	setActiveClassForClickedServerButtons(button, testServersSelected);
	setActiveClassForSubmitServerListButton('submitTests', testServersSelected);
};

const createDeleteButton = (objectId, deleteFunctionName) => {
	let deleteButton = document.createElement('button');
	deleteButton.classList.add('btn', 'btn-outline-danger', 'col-5');
	deleteButton.setAttribute('onclick', `${deleteFunctionName}('${objectId}')`);

	let deleteRow = document.createElement('div');
	deleteRow.classList.add('row', 'justify-content-center');

	let deleteLabel = document.createElement('div');
	deleteLabel.classList.add('col-3');
	deleteLabel.innerText = 'Delete';
	deleteRow.appendChild(deleteLabel);

	let deleteIcon = document.createElement('i');
	deleteIcon.classList.add('material-icons-round', 'col-1');
	deleteIcon.innerText = 'delete_forever';
	deleteRow.appendChild(deleteIcon);

	deleteButton.appendChild(deleteRow);
	return deleteButton;
};

let deleteServer = (serverId) => {
	console.log(serverId);
	let data = {
		apiId: apiSelected,
		serverId: serverId,
	};
	client.emit('deleteServer', data)
};

const getServerRegionsUsedByCurrentApi = () => {
	return Object.values(APIStatus[apiSelected].servers).map((server) => {
		return server.region
	});
};

const displayAvailableServers = gcpServerList => {
	let serverRegionsUsed = getServerRegionsUsedByCurrentApi();

	Array.from(gcpServerList.children).map((server) => {
		if (serverRegionsUsed.includes(server.getAttribute('gcpregion'))) server.style.display = 'none';
		else server.style.display = 'block';
	})
};

const removeActiveClassFromServers = gcpServerList => {
	Array.from(gcpServerList.children).map((server) => {
		server.classList.remove('active');
	});
};

const setSubmitButtonDisabled = () => {
	let submitButton = document.getElementById('submitServers');
	submitButton.setAttribute('disabled', '');
};

let prepareModalForServerSelection = () => {
	setSubmitButtonDisabled();
	let gcpServerList = document.getElementById('GCPServers');
	removeActiveClassFromServers(gcpServerList);
	displayAvailableServers(gcpServerList);
};

let setActiveClassForClickedServerButtons = (button, serverSelectionList) => {
	if (!button.classList.contains('active')) {
		serverSelectionList.push(button.getAttribute('gcpregion'));
		button.classList.remove('btn-outline-primary');
		button.classList.add('btn-success');
		button.classList.add('active');
	} else {
		serverSelectionList.remove(button.getAttribute('gcpregion'));
		button.classList.remove('active');
		button.classList.remove('btn-success');
		button.classList.add('btn-outline-primary');
	}
};

let setActiveClassForSubmitServerListButton = (submitButtonId, serverSelectionList) => {
	let submitButton = document.getElementById(submitButtonId);
	let atLeastOneServerSelected = serverSelectionList.length > 0;
	if (atLeastOneServerSelected) {
		submitButton.removeAttribute('disabled');
	} else {
		submitButton.setAttribute('disabled', '');
	}
};

let serverSelected = (button) => {
	setActiveClassForClickedServerButtons(button, serversSelected);
	setActiveClassForSubmitServerListButton('submitServers', serversSelected);
};

let makeAddServerButtonAppear = () => {
	let addServerButton = document.getElementById('addServerDiv');
	addServerButton.style.display = 'block';
}

let addServerlistToHTML = (serverList) => {
	let el = document.getElementById('serverDiv');
	removeChildren(el);
	for (let server of serverList) {
		let newServerEl = document.createElement("a");
		newServerEl.setAttribute("class", "list-group-item list-group-item-action");
		newServerEl.setAttribute("onclick", ""); //TODO Nom de la fonction
		newServerEl.innerText = server.location;
		el.appendChild(newServerEl);
		console.log("Server Ajouté");
	}
};

let removeChildren = (element) => {
	while (element.lastChild) {
		element.removeChild(element.lastChild);
	}
};

let removeActiveClassFromAllApis = () => {
	let apiList = document.getElementById('apiDiv');
	Array.from(apiList.children).map((child) => {
		child.classList.remove("active");
	});
};

let displaySelectedApiAsActive = (apiId) => document.getElementById('api' + apiId).classList.add("active");

let hideAllServerLists = () => {
	let servers = Object.values(serverDivsDom);
	servers.map((server) => {
		server.setAttribute('style', 'display : none');
	});
};

let displaySelectedApiServerList = (apiId) => {
	if (serverDivsDom[apiId]) serverDivsDom[apiId].setAttribute('style', 'display : block');
};

let displayServerList = (apiId) => {
	hideAllServerLists();
	displaySelectedApiServerList(apiId);
};

let refreshApiElement = (apiId, api) => {
	if (apisDom[apiId]) {
		updateApiElement(apiId, api)
	} else {
		createApiElement(apiId, api)
	}
};

let updateApiElement = (apiId, api) => {
	apisDom[apiId].pName.innerText = api.name;
	apisDom[apiId].progressBar.element.style.width = api.progress /api.totalProgress * 100 + '%';
	apisDom[apiId].progressBar.element.setAttribute('aria-valuenow', api.progress)

};

let getApiProgressAndTotalProgress = (apiId, api) => {
	let progress = Object.values(api.servers).reduce((progress, server) => {
		return progress + server.progress;
	}, 0);

	let totalProgress = Object.values(api.servers).reduce((totalProgress, server) => {
		return totalProgress + server.totalProgress;
	}, 0);

	return {progress, totalProgress};
};

const createApiProgressBar = (apiId, api) => {
	let progressBar = document.createElement('div');
	progressBar.setAttribute('class', 'progress');
	progressBar.setAttribute('id', 'progressBar' + apiId);
	let {progress, totalProgress} = getApiProgressAndTotalProgress(apiId, api);
	let progressBarElement = createProgressBarElement(progress, totalProgress);
	progressBar.element = progressBarElement;
	progressBar.appendChild(progressBarElement);
	apisDom[apiId].progressBar = progressBar;
	return progressBar;
};

const createApiDownloadTestButton = () => {
	let downloadTestButton = document.createElement('button');
	downloadTestButton.classList.add('btn', 'btn-outline-info', 'col-3');
	downloadTestButton.disabled = true;
	downloadTestButton.innerText = "Download tests";
	return downloadTestButton;
};

const createApiTestCreationButton = () => {
	let testCreation = document.createElement('button');
	testCreation.classList.add('btn', 'btn-outline-info', 'col-3');
	testCreation.setAttribute('data-toggle', 'modal');
	testCreation.setAttribute('data-target', '#testSelectionModal');
	testCreation.setAttribute('onclick', 'createTestButtonClicked()');
	testCreation.innerText = "Create test";
	return testCreation;
};

const createCollapseApiButtons = (apiId, api) => {
	let row = document.createElement('div');
	row.classList.add('row', 'justify-content-around');

	row.appendChild(createApiTestCreationButton());
	row.appendChild(createApiDownloadTestButton());
	row.appendChild(createDeleteButton(apiId, 'deleteApi'));
	return row;
};

const createApiCollapseDiv = (apiId, api) => {
	let newCollapse = document.createElement('div');
	newCollapse.classList.add('collapse');
	newCollapse.setAttribute('id', `collapse${apiId}`);
	let collapseBody = document.createElement('div');
	collapseBody.classList.add('card-body');
	collapseBody.appendChild(createCollapseApiButtons(apiId, api));
	apisDom[apiId].collapseDiv = newCollapse;
	newCollapse.appendChild(collapseBody);
	return newCollapse;
};

const createNameApiDiv = (apiId, api) => {
	let colName = document.createElement('div');
	colName.setAttribute('class', 'col');
	let pName = document.createElement('p');
	pName.setAttribute('id', `name${apiId}`);
	pName.innerText = api.name;
	colName.appendChild(pName);
	apisDom[apiId].pName = pName;

	return colName;
};

const createApiBodyDiv = (apiId, api) => {
	let bodyElement = document.createElement('div');
	bodyElement.setAttribute('id', 'apiBody' + apiId);
	bodyElement.setAttribute('data-toggle', 'collapse');
	bodyElement.setAttribute('role', 'button');
	bodyElement.setAttribute('href', `#collapse${apiId}`);
	bodyElement.setAttribute('aria-expanded', 'false');
	bodyElement.setAttribute('aria-controls', `collapse${apiId}`);
	bodyElement.setAttribute('onclick', 'clickOnApi(' + apiId + ')');

	bodyElement.appendChild(createNameApiDiv(apiId, api));
	bodyElement.appendChild(createApiProgressBar(apiId, api));
	return bodyElement;
};

let createApiElement = (apiId, api) => {

	let newApiElement = document.createElement('a');
	apisDom[apiId] = newApiElement;
	apisDom[apiId].apiId = apiId;
	newApiElement.classList.add('list-group-item', 'list-group-item-action', 'list-group-item-success');
	newApiElement.setAttribute('id', 'api' + apiId);
	newApiElement.appendChild(createApiBodyDiv(apiId, api));
	newApiElement.appendChild(createApiCollapseDiv(apiId, api));
	addNewApiElement(newApiElement);
};

let addNewApiElement = (newApiElement) => {
	document.getElementById('apiDiv').appendChild(newApiElement);
};

let updateServerElement = (serverId, server, apiId) => {
	let serverDiv = serversDom[serverId];
	serverDiv.pStatus.innerText = server.status;
	serverDiv.progressBar.element.style.width = server.progress / server.totalProgress * 100 + '%';
	serverDiv.progressBar.element.setAttribute('aria-valuenow', server.progress)
};

let createProgressBarElement = (progress, totalProgress) => {
	let progressBarElement = document.createElement('div');
	progressBarElement.setAttribute('class', 'progress-bar progress-bar-striped progress-bar-animated bg-info');
	progressBarElement.setAttribute('role', 'progressbar');
	progressBarElement.setAttribute('aria-valuenow', progress);
	progressBarElement.setAttribute('aria-valuemin', '0');
	progressBarElement.setAttribute('aria-valuemax', totalProgress);
	let percentage = progress / totalProgress * 100;
	progressBarElement.setAttribute('style', 'width: ' + percentage + '%');
	return progressBarElement;
};

let createServerProgressBar = (serverId, server) => {
	let progressBar = document.createElement('div');
	progressBar.setAttribute('class', 'progress');
	progressBar.setAttribute('id', 'progressBar' + serverId);
	let progress = server.progress, totalProgress = server.totalProgress;
	let progressBarElement = createProgressBarElement(progress, totalProgress);
	progressBar.element = progressBarElement;
	progressBar.appendChild(progressBarElement);
	serversDom[serverId].progressBar = progressBar;
	return progressBar;
};

let collapseIconClicked = (e) => {
	if (e.innerText === 'keyboard_arrow_down') e.innerText = 'keyboard_arrow_up';
	else e.innerText = 'keyboard_arrow_down'
};

const createServerNameDiv = (serverId, server) => {
	let colName = document.createElement('div');
	colName.setAttribute('class', 'col');
	let pName = document.createElement('p');
	pName.setAttribute('id', `name${serverId}`);
	pName.innerText = server.location;
	colName.appendChild(pName);
	serversDom[serverId].pName = pName;

	return colName;
};

const createServerStatusDiv = (serverId, server) => {
	let colStatus = document.createElement('div');
	colStatus.setAttribute('class', 'col');
	let pStatus = document.createElement('p');
	pStatus.setAttribute('id', `status${serverId}`);
	pStatus.innerText = server.status;
	colStatus.appendChild(pStatus);
	serversDom[serverId].pStatus = pStatus;
	return colStatus;
};

const createServerCollapseButton = collapseId => {
	let colCollapse = document.createElement('div');
	colCollapse.setAttribute('data-toggle', 'collapse');
	colCollapse.setAttribute('role', 'button');
	colCollapse.setAttribute('href', `#collapse${collapseId}`);
	colCollapse.setAttribute('aria-expanded', 'false');
	colCollapse.setAttribute('aria-controls', `collapse${collapseId}`);
	colCollapse.setAttribute('class', 'col-1');
	let collapseIcon = document.createElement('i');
	collapseIcon.classList.add('material-icons-round');
	collapseIcon.setAttribute('onclick', 'collapseIconClicked(this)');
	collapseIcon.innerText = 'keyboard_arrow_down';
	colCollapse.appendChild(collapseIcon);
	return colCollapse;
};

let createServerNameStatusCollapseRow = (serverId, server) => {
	let row = document.createElement('div');
	row.setAttribute('class', 'row');

	row.appendChild(createServerNameDiv(serverId, server));
	row.appendChild(createServerStatusDiv(serverId, server));
	row.appendChild(createServerCollapseButton(serverId));

	return row;
};

const createServerDownloadTestButton = (serverId, server) => {
	let downloadTestButton = document.createElement('button');
	downloadTestButton.classList.add('btn', 'btn-outline-info', 'col-5');
	// downloadTestButton.setAttribute('data-toggle', 'modal');
	// downloadTestButton.setAttribute('data-target', '#testSelectionModal');
	downloadTestButton.innerHTML = "Download tests";
	if (server.status !== "Test finished") {
		downloadTestButton.disabled = true;
	}
	serversDom[serverId].downloadTestButton = downloadTestButton;
	return downloadTestButton;
};


let createServerCollapseButtons = (serverId, server) => {
	let row = document.createElement('div');
	row.classList.add('row', 'justify-content-around');

	row.appendChild(createServerDownloadTestButton(serverId, server));
	row.appendChild(createDeleteButton(serverId, 'deleteServer'));
	return row;
};

let createServerCollapseDiv = (serverId, server) => {
	let newCollapse = document.createElement('div');
	newCollapse.classList.add('collapse');
	newCollapse.setAttribute('id', `collapse${serverId}`);
	let collapseBody = document.createElement('div');
	collapseBody.classList.add('card-body');
	collapseBody.appendChild(createServerCollapseButtons(serverId, server));
	newCollapse.appendChild(collapseBody);
	return newCollapse;
};

let createServerBodyDiv = (serverId, server) => {
	let bodyElement = document.createElement('div');
	bodyElement.setAttribute('id', 'serverBody' + serverId);

	bodyElement.appendChild(createServerNameStatusCollapseRow(serverId, server));
	bodyElement.appendChild(createServerProgressBar(serverId, server));
	return bodyElement;
};

let createServerElement = (serverId, server, apiId) => {

	let newServerElement = document.createElement('a');
	serversDom[serverId] = newServerElement;
	newServerElement.setAttribute('class', 'list-group-item list-group-item-warning');
	newServerElement.setAttribute('id', 'server' + serverId);
	newServerElement.appendChild(createServerBodyDiv(serverId, server));
	newServerElement.appendChild(createServerCollapseDiv(serverId, server));

	addNewServerElement(newServerElement, apiId);
};

let addNewServerElement = (newServerElement, apiId) => {
	if (serverDivsDom[apiId]) {
		serverDivsDom[apiId].appendChild(newServerElement);
	} else {
		let serverDiv = document.createElement('div');
		serverDiv.setAttribute('id', apiId + 'serverDiv');
		if (apiSelected === apiId) {
			serverDiv.setAttribute('style', 'display : block');
		} else {
			serverDiv.setAttribute('style', 'display : none');
		}
		serverDiv.appendChild(newServerElement);
		serverDivsDom[apiId] = serverDiv;
		let serversDiv = document.getElementById('serverDiv');
		serversDiv.appendChild(serverDiv);
	}
};

let refreshServerElement = (serverId, server, apiId) => {
	if (serversDom[serverId]) {
		updateServerElement(serverId, server, apiId);
	} else {
		createServerElement(serverId, server, apiId);
	}
};

let refreshServerElements = (apiId, api) => {
	let serverIds = Object.keys(api.servers);
	for (let j = 0; j < serverIds.length; j++) {
		let serverId = serverIds[j];
		let server = api.servers[serverId];
		refreshServerElement(serverId, server, apiId);
	}
};

let createAPIStatusElements = (apis) => {
	for (let i = 0; i < apis.length; i++) {
		let apiId = apis[i][0];
		let api = apis[i][1];
		refreshApiElement(apiId, api);
		refreshServerElements(apiId, api);
	}
};

let deleteOldAPIStatus = (apiId) => {
	let apiDiv = apisDom[apiId];
	apiDiv.parentElement.removeChild(apiDiv);
	let serverDiv = serverDivsDom[apiId];
	serverDiv.parentElement.removeChild(serverDiv);
};

let deleteOldServer = (serverId) => {
	let serverDiv = serversDom[serverId];
	serverDiv.parentElement.removeChild(serverDiv);
};

let updateAPIStatusElement = (apiId, oldApi, newApi) => {

	let oldServersIds = Object.keys(oldApi.servers);
	let newServersIds = Object.keys(newApi.servers);
	if (newServersIds.length > oldServersIds.length) {
		newServersIds.filter((serverId) => {
			if (!oldServersIds.includes(serverId)) {
				createServerElement(serverId, newApi.servers[serverId], apiId);
			}
		})
	} else if (newServersIds.length < oldServersIds.length) {
		oldServersIds.filter((serverId) => {
			if (!newServersIds.includes(serverId)) {
				deleteOldServer(serverId);
			}
		})
	} else {
		oldServersIds.filter((serverId) => {
			if (!isEqual(oldApi.servers[serverId], newApi.servers[serverId])) {
				refreshServerElement(serverId, newApi.servers[serverId], apiId);
			}
		})
	}
};

let refreshAPIStatus = (newAPIStatus) => {
	if (APIStatus === null) {						//First time webclient receive APIStatus
		createAPIStatusElements(Object.entries(newAPIStatus));
	} else if (!isEqual(APIStatus, newAPIStatus)) {	//The new APIStatus is not the same as its own
		let oldApisIds = Object.keys(APIStatus);
		let newApiIds = Object.keys(newAPIStatus);
		if (newApiIds.length > oldApisIds.length) { 				//An API has been added
			newApiIds.filter((apiId) => {
				if (!oldApisIds.includes(apiId)) {
					createAPIStatusElements([[apiId, newAPIStatus[apiId]]]);
				}
			});
		} else if (newApiIds.length < oldApisIds.length) {			//An API has been deleted
			oldApisIds.filter((apiId) => {
				if (!newApiIds.includes(apiId)) {
					deleteOldAPIStatus(apiId);
				}
			});
		} else {
			oldApisIds.filter((apiId) => {
				if (!isEqual(APIStatus[apiId], newAPIStatus[apiId])) {
					updateAPIStatusElement(apiId, APIStatus[apiId], newAPIStatus[apiId]);
				}
			})
		}
	}
	APIStatus = newAPIStatus;
};
