function populateTable(canvas, data, bar) {
    var d = new Date();
    $("#sensordata").html("Retrieved at " + d.toString());
    var tbl_body = "";
    $(bar).width('70%');
    $.each(data.sensors, function() {
        var tbl_row = "";
        $.each(this, function(k , v) {
	    tbl_row += "<td>"+v+"</td>";
        });
	tbl_body += "<tr>"+tbl_row+"</tr>";                 
    });
    $(bar).width('90%');
    $("#sensortable tbody").html(tbl_body);
    $(bar).width('100%');

    var table = document.getElementById("sensortable");
    var rows = table.getElementsByTagName("tr");
    for(i=0; i<rows.length; i++) {
//	alert("Found " + rows[i].nodeName + ": " + rows[i].childNodes[1]);
	if(rows[i].childNodes[1].innerText == 'DS18B20') {
	    var value = rows[i].childNodes[2].innerText;
	    rows[i].onclick = function() {drawThermometer(canvas, value)};
	}
	else {
	    rows[i].onclick = function() {drawGraph(canvas, [])};
	}
    }
}

// Set the canvas size and clear it as a side effect
function prepareCanvas(canvas, width, height) {
    var c    = document.getElementById(canvas);
    c.height = height;
    c.width  = width;
//    var ctx = c.getContext("2d");
//    ctx.clearRect(0, 0, c.width, c.height);
}

function drawThermometer(canvas, data) {
    prepareCanvas(canvas, 150, 200);

    // Create the Thermometer chart. The arguments are: the canvas ID, the minimum,
    // the maximum and the indicated value.
    var thermometer = new RGraph.Thermometer(canvas, 0, 100, parseInt(data));
        
    // Configure the thermometer chart to look as you want.
    thermometer.Set('chart.gutter.left', 45);
    thermometer.Set('chart.gutter.right', 45);
    thermometer.Set('chart.colors', ['rgba(255,0,0,1)']);
        
    // Now call the .Draw() method to draw the chart.
    thermometer.Draw();
}

function drawGraph(canvas, data) {
    prepareCanvas(canvas, 400, 400);

    // The data for the Line chart. Multiple lines are specified as seperate arrays.
    var data = [24,25,27,29,28,28,28,30,33,35,31,29,29,27,25,25,25,23];

    // Create the Line chart object. The arguments are the canvas ID and the data array.
    var line = new RGraph.Line(canvas, data);
        
    // The way to specify multiple lines is by giving multiple arrays, like this:
    // var line = new RGraph.Line("myLine", [4,6,8], [8,4,6], [4,5,3]);
        
    // Configure the chart to appear as you wish.
    line.Set('chart.background.barcolor1', 'white');
    line.Set('chart.background.barcolor2', 'white');
    line.Set('chart.background.grid.color', 'rgba(238,238,238,1)');
    line.Set('chart.colors', ['red']);
    line.Set('chart.linewidth', 2);
    line.Set('chart.filled', false);
    line.Set('chart.hmargin', 5);
    var xlabels = [];
    for (var i = 0; i < data.length; i++) {
	xlabels.push(i);
    }
    line.Set('chart.labels', xlabels);
    line.Set('chart.gutter.left', 40);
        
    // Now call the .Draw() method to draw the chart.
    line.Draw();
}

function updateSensorData(canvas, url, bar) {
    $.ajax({
        url: url,
        timeout: 10000,
	dataType: 'json',
	success: function(data){populateTable(canvas, data, bar);},
	error: function(jqXHR, status, thrown){alert("error: " + status + ": " + thrown);}
    });
    $(bar).width('60%');
}

function resizeCanvas(canvas){
    canvas = document.getElementById(canvas);
    if (canvas.width  < window.innerWidth)
    {
        canvas.width  = window.innerWidth;
    }

    if (canvas.height < window.innerHeight)
    {
        canvas.height = window.innerHeight;
    }
}

function rrd2Date(str) {
//    var secs = str.split(':')[0];
    str *= 1000;
    return new Date(str);
}

function d3Graph(url){
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 600 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

//    var parseDate = d3.time.format("%d-%b-%y").parse;
    var parseDate = rrd2Date;

    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]).domain([-100,100]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    var line = d3.svg.line().x(function(d) { return x(d.date); })
	.y(function(d) { return y(d.close); });

    var svg = d3.select("body").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv(url, function(error, data) {
	data.forEach(function(d) {
//	    d.date = parseDate(d.date);
	    d.date = rrd2Date(d.date);
	    d.close = d.close.split('e+')[0].replace(',', '.');
//	    d.close = +d.close;
	});

	x.domain(d3.extent(data, function(d) { return d.date;  }));
	y.domain(d3.extent(data, function(d) { return d.close; }));

	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);

	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	    .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")
	    .text("Temperature");

	svg.append("path")
	    .datum(data)
	    .attr("class", "line")
	    .attr("d", line);
    });
}
