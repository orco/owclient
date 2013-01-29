var host       = "localhost";
var port       = 4304;
var Client     = require("owfs").Client;
var owserver   = new Client(host, port);
//var ui         = require("./ui");
var lastupdate = new Date();
var lastresult = null;

function sensorType(id, callback) {
    var path = id + "/type";
    owserver.read(path, function(type){
	callback(id, type);
    });
}

function sensorValue(id, type, callback) {
    switch(type) {
    case "DS18B20":
    case "DS18S20":
	owserver.read(id + "/temperature", function(value){
	    callback(id, Math.round(value*10)/10);
	});
	break;
    case "DS2423":
	owserver.read(id + "/counters.B", function(value){
	    callback(id, value);
	});
	break;
    case "DS2438":
	owserver.read(id + "/humidity", function(value){
	    callback(id, Math.round(value*10)/10);
	});
	break;
    case "DS2760":
	owserver.read(id + "/typeK/temperature", function(value){
	    callback(id, Math.round(value*10)/10);
	});
	break;
    default:
	callback(id, -1);
	break;
    }
}

function findIndex(id, sensors) {
    var found = 0;
    var index = 0;
//    console.log("Looking for  " + id + " amongst " + sensors.length + " candidates");
    for (index = 0; index < sensors.length; index++) {
//	console.log(sensors[index].id + " : " + index);
	if(sensors[index].id == id) {
	    found = 1;
	    break;
	}
    }
    if(found)
	return index;
    return -1;
}

function handleDirs(dirs, callback) {
    // If less than 100 seconds since last refresh
    // just return the old values
    var now   = new Date();
    var since = (now - lastupdate) / 1000;
    if(lastresult && (since < 100)) {
	console.log("Only " + since + " seconds since last update");
	callback(lastresult);
	return;
    }
    var result = {realSensors : 0, virtualSensors : 0, sensors: []};
    //console.log("Found " + dirs.length + " sensors");
    for(var d in dirs) {
	var name = dirs[d].replace(/^\//,'');
	sensorType(name, function(id, type) {
	    result.sensors.push({id: id, type: type, value: -1});
	    sensorValue(id, type, function(id, value) {
		if(value === -1) {
		    //console.log("Removing " + id + " as it seems to be a 1-wire node");
		    index = findIndex(id, result.sensors);
		    delete result.sensors.splice(index, 1);
		    result.virtualSensors += 1;
		}
		else {
		    index = findIndex(id, result.sensors);
		    if(index > -1) {
			result.sensors[index].value = value;
		    }
		    result.realSensors += 1;
		}
		if(result.realSensors + result.virtualSensors === dirs.length) {
		    lastresult = result;
		    lastupdate = now;
		    callback(result);
		    //console.log(result);
		}
	    });
	});
    }
}

function allSensors(callback) {
    owserver.dirall("/", function(dirs) {
	handleDirs(dirs, callback);
    })
}

function allSensorsWithResponse(response) {
    allSensors(function (result) {
	response.writeHead(200, {"Content-Type": "application/json"});
	response.write(JSON.stringify(result));
	response.end();
    });
}

function allSensorsWithConsole() {
    allSensors(console.log);
}

function getTempHistory(name, callback) {
    var spawn   = require('child_process').spawn;
    var rrdTool = spawn('rrdtool', ['fetch', 
				    '/pub/rrd/' + name + '.rrd', 
				    'AVERAGE', 
				    '-r', 
				    '900', 
				    '-s', 
				    '-24h']);
    rrdTool.stdout.on('data', function (data) {
//	response.write('' + data.toString().
	var payload = data.toString().
	    replace(/,/g, '.').
	    replace(/: /g, '\t').
	    replace(/\n.*\tnan/g, '').
	    replace(/\n\n/g, '\n').
	    split('\n').
	    slice(1).toString().
	    replace(/,/g, '\n');
	payload = 'date\tclose\n' + payload;
	console.log(payload);
	callback(payload);
//	response.end();
    });
}

function getTempHistoryWithConsole(name, response) {
    getTempHistory(name, console.log);
}

function getTempHistoryWithResponse(name, response) {
    getTempHistory(name, function (result) {
	response.writeHead(200, {"Content-Type": "application/tsv"});
	response.write(result);
	response.end();	
    });
}

exports.allSensorsWithResponse	   = allSensorsWithResponse;
exports.allSensorsWithConsole	   = allSensorsWithConsole;
exports.getTempHistory		   = getTempHistory;
exports.getTempHistoryWithResponse = getTempHistoryWithResponse;
