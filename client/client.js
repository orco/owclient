function populateTable(url, data, bar) {
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

    var table  = document.getElementById("sensortable");
    var noRows = table.getElementsByTagName("tr").length;
    for(i=0; i<noRows; i++) {
	row = table.getElementsByTagName("tr")[i];
	if(row.childNodes[1].innerText.indexOf("DS" == 0)) {
	    var id = row.childNodes[0].innerText;
	    row.onclick = function() {
		var name = this.childNodes[0].innerText;
		$('#myModal').modal();
		d3Graph(url + '/history/' + this.childNodes[0].innerText + '/1h');
		$("#hour").click(function() {
		    d3.select('#history').select('svg').remove();
		    d3Graph(url + '/history/' + name + '/1h');
		});
		$("#day").click(function() {
		    d3.select('#history').select('svg').remove();
		    d3Graph(url + '/history/' + name + '/1d');
		});
		$("#week").click(function() {
		    d3.select('#history').select('svg').remove();
		    d3Graph(url + '/history/' + name + '/1w');
		});
	    };
	}
    }
}

function updateSensorData(url, bar) {
    $.ajax({
        url: url,
        timeout: 10000,
	dataType: 'json',
	success: function(data){populateTable(url, data, bar);},
	error: function(jqXHR, status, thrown){alert("error: " + status + ": " + thrown);}
    });
    $(bar).width('60%');
}

function rrd2Date(str) {
    str *= 1000;
    return new Date(str);
}

function d3Graph(url){
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 500 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

    var parseDate = rrd2Date;

    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]).domain([-100,100]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    var line = d3.svg.line().x(function(d) { return x(d.date); })
	.y(function(d) { return y(d.close); });

    var svg = d3.select("#history").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv(url, function(error, data) {
	data.forEach(function(d) {
	    d.date = rrd2Date(d.date);
	    d.close = parseFloat(d.close);
//	    d.close = parseFloat(d.close.replace(',', '.'));
//	    parts  = d.close.split('e+');
//	    d.close = parts[0].replace(',', '.') * Math.pow(10, parts[1]);
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
