class SlaveClient {
	constructor(client, master, slaveInfo) {
		this._client = client;
		this._master = master;
		this._id = slaveInfo.id;
		this._region = slaveInfo.region;
		this._token = slaveInfo.token;
	}

	createNewAPITest(apiID){
		this._client.on(apiID, (data) => {
			this._master.retrieveDataFromChannel(data);
		});
	}

	get client() {
		return this._client;
	}
}

module.exports = SlaveClient;