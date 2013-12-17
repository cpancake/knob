var fs = require('fs');

exports.getFileURL = function(file)
{
	return '/cdn/' + file;
}

exports.uploadFile = function(Knob, stream, file, callback)
{
	var destStream = fs.createWriteStream(process.cwd() + '/cdn/' + file);
	stream.on('end', function(err) {
		if(err)
			return callback('Failed to upload file.');
		callback(null);
	});
	stream.on('error', function(err) {
		return callback('Failed to upload file.');
	});
	stream.pipe(destStream);
}

exports.initialize = function(Knob)
{
	Knob.App.get('/cdn/:file', function(req, res) {
		file = req.params.file;
		if(!fs.existsSync(process.cwd() + '/cdn/' + file))
			res.status(404);
		else
			res.sendfile(process.cwd() + '/cdn/' + file);
	});
}