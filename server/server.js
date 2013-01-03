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
//	console.log("Headers: " + util.inspect(request));
	console.log(reqtype + " request for " + request.url + " received.");
	if (reqtype == "async") {
            // handle async request
	    owfs.allSensorsWithResponse(response);
	}
	else {
            // handle sync request (by server index.html)
            if (request.url == '/') {
		response.writeHead(200, {'content-type': 'text/html'})
//		var str = fs.readFileSync('index.html');
//		str.replace("XXX", host);
//		fs.writeFileSync('index.html', str);
		fs.createReadStream('index.html').pipe(response);
            }
            else {
		console.log("Looking for existence of " + request.url);
		fs.lstat(request.url, function (err, stats) {
		    if(!err && stats.isFile()) {
			response.writeHead(200)
//			response.writeHead(200, {'content-type': 'text/html'})
			fs.createReadStream(request.url).pipe(response);
		    }
		    else {
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
