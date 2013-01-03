function generatePage(str) {
    var contents = '';
    contents += '<!DOCTYPE html>\n';
    contents += '<html>\n';
    contents += '<head>\n';
    contents += '<title>Bootstrap 101 Template</title>\n';
    contents += '<!-- Bootstrap -->\n';
    contents += '<link href="bootstrap/css/bootstrap.min.css" rel="stylesheet" media="screen">\n';
    contents += '</head>\n';
    contents += '<body>\n';
    contents += str + '\n';
    contents += '<script src="http://code.jquery.com/jquery-latest.js"></script>\n';
    contents += '<script src="bootstrap/js/bootstrap.min.js"></script>\n';
    contents += '</body>\n';
    contents += '</html>\n';
    return contents;
}

exports.generatePage = generatePage;
