function populateTable(data, bar) {
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
}

function updateSensorData(url, bar) {
    $.ajax({
        url: url,
        timeout: 10000,
	dataType: 'json',
	success: function(data){populateTable(data, bar);},
	error: function(jqXHR, status, thrown){alert("error: " + status + ": " + thrown);}
    });
    $(bar).width('60%');
}
