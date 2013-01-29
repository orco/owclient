var fs   = require("fs"),
    http = require("http"),
    url  = require("url");
    util = require("util");
    owfs = require("./ow");

function start() {
    function onRequest(request, response) {
	var u = url.parse(request.url, true);
	var headers = request.headers['x-requested-with'];
        var host    = request.headers['host'];
	var reqtype = headers == 'XMLHttpRequest' ? "async" : "sync";
	console.log(reqtype + " request for " + request.url + " received.");
	if (reqtype == "async") {
            // handle async requests
	    if(request.url.indexOf("/history") == 0) {
		owfs.getTempHistory(request.url.
				    slice(request.url.lastIndexOf('/history/'+1)),
				    response);
	    }
	    else {
		owfs.allSensorsWithResponse(response);
	    }
	}
	else {
            // handle sync request (by server index.html)
            if (request.url == '/') {
		var mimeType = 'text/html';
		response.writeHead(200, {'content-type': mimeType})
		fs.createReadStream('index.html').pipe(response);
            }
	    else if(request.url.indexOf("/history") == 0) {
		var sensorName = request.url.slice(9);
		console.log("Requesting data for " + sensorName);
		owfs.getTempHistoryWithResponse(sensorName, response);
	    }
            else {
		console.log("Looking for existence of " + request.url);
		fs.lstat(request.url, function (err, stats) {
		    if(!err && stats.isFile()) {
			var suffix = request.url.split(".").pop();
			var mimeType = 'text/html';
			if(! suffix)
			    suffix = "";
			if(suffix == "css") {
			    mimeType = "text/css";
			}
			if(suffix == "js") {
			    mimeType = "application/javascript";
			}
			response.writeHead(200, {'content-type': mimeType})
			fs.createReadStream(request.url).pipe(response);
		    }
		    else {
			console.log("Could not find " + request.url);
			response.writeHead(404, {'content-type': 'text/html'})
			response.write("<html>");
			response.write("<header>");
			response.write("</header>");
			response.write("<body>");
			response.write(request.url + " not found!");
			response.write("</body>");
			response.write("</html>");
			response.end();
		    }
		});
	    }
	}
    }

    http.createServer(onRequest).listen(443);
    console.log("Server has started.");
}

exports.start = start;
