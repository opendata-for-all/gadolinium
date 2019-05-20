if(process.argv[1] === "master"){
	require('./master/index');
}
else if(process.argv[1] === "slave"){
	require('./slave/index');
}
