var host       = "localhost";
var port       = 4304;
var Client     = require("owfs").Client;
var owserver   = new Client(host, port);
var lastupdate = new Date();
var lastresult = null;
var sensorMap  = new Array();

sensorMap["1D.B3B00D000000"] = "energi.rrd";
sensorMap["28.0C284B030000"] = "kallare.rrd";
sensorMap["30.FFDF61120000"] = "rokgas.rrd";
sensorMap["10.057C7C010800"] = "inne.rrd";
sensorMap["10.29877C010800"] = "ute.rrd";
sensorMap["10.627F7C010800"] = "stigare.rrd";

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

function getTempHistory(nameAndTime, callback) {
    var parts   = nameAndTime.split('/');
    var name    = parts[0];
    var time    = '-' + parts[1];
    var spawn   = require('child_process').spawn;
    var rrdFile = '/pub/rrd/' + sensorMap[name];
    var rrdTool = spawn('rrdtool', ['fetch', 
				    rrdFile, 
				    'AVERAGE', 
				    '-r', 
				    '900', 
				    '-s', 
				    time]);
    rrdTool.stdout.on('data', function (data) {
	var payload = data.toString().
	    replace(/^[^:]*\n$/g, '').
	    replace(/\d+: nan/g, '').
	    replace(/,/g, '.').
	    replace(/: /g, '\t').
	    replace(/\n\n/g, '\n').
	    split('\n').
	    slice(1).toString().
	    replace(/,/g, '\n');
	console.log(payload);
	console.log('sending payload of ' + payload.length + 'bytes');
	callback(payload);
    });
    rrdTool.on('exit', function (data) {
	console.log('rrdTool exit');
	callback('end');
    });
}

function getTempHistoryWithConsole(name, response) {
    getTempHistory(name, console.log);
}

function getTempHistoryWithResponse(name, response) {
    response.writeHead(200, {"Content-Type": "application/tsv"});
    response.write('date\tclose\n');
    getTempHistory(name, function (result) {
	if(result == 'end') {
	    console.log('end');
	    response.end();
	}
	else {
	    response.write(result);
	}
    });
}

exports.allSensorsWithResponse	   = allSensorsWithResponse;
exports.allSensorsWithConsole	   = allSensorsWithConsole;
exports.getTempHistory		   = getTempHistory;
exports.getTempHistoryWithResponse = getTempHistoryWithResponse;
