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

function drawThermometer(canvas, data) {
    // Create the Thermometer chart. The arguments are: the canvas ID, the minimum,
    // the maximum and the indicated value.
    var thermometer = new RGraph.Thermometer(canvas, 0, 100, parseInt(data));
        
    // Configure the thermometer chart to look as you want.
    //thermometer.Set('chart.gutter.left', 45);
    //thermometer.Set('chart.gutter.right', 45);
    thermometer.Set('chart.colors', ['rgba(255,0,0,1)']);
        
    // Now call the .Draw() method to draw the chart.
    thermometer.Draw();
}

function drawGraph(canvas, data) {
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
