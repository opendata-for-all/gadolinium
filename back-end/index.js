if(process.argv[1] === "master"){
	require('./back-end/master/index');
}
else if(process.argv[1] === "slave"){
	require('./back-end/slave/index');
}
