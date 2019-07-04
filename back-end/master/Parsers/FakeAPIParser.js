class FakeAPIParser{
	static parse(openAPIJson){
		let httpRequests = [];
		for (let i = 0; i < 5; i++) {
			httpRequests.push({
				"operationId": "test" + (i + 1),
				"method": "get",
				"headers": {},
				"params": {},
				"url": "http://localhost:8082/test" + (i + 1)
			},)
		}
		console.log(httpRequests);
		return httpRequests
	}
}

module.exports = FakeAPIParser;
