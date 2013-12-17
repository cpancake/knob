var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var handlebars = require('handlebars');
var imageinfo = require('imageinfo');

var allowedTypes = ['application/x-shockwave-flash', 'application/vnd.adobe.flash-movie'];
var allowedSize = 1000 * 1000 * 5; //5MB limit

exports.name = 'Flash';

var Knob;

exports.addPost = function(req, res, knob, callback)
{
	Knob = knob;

	Knob = knob;
	user = req.session.user;
	tags_str = req.body.tags;
	if(!req.files || !req.files.image)
		return callback('No file provided.', null);
	file = req.files.image;
	if(allowedTypes.indexOf(file.type) == -1)
		return callback('File must be a SWF.', null);
	if(file.size > allowedSize)
		return callback('File must be 2MB or less.', null);
	if(tags_str) 
		tags = tags_str.split(',');
	else
		tags = [];
	tags = Knob.Util.sanitizeTags(tags);
	filepath = file.path;
	hash = crypto.createHash('sha1').update(Date.now().toString() + Math.random().toString()).digest('hex');
	var fileStream = fs.createReadStream(filepath);
	fs.readFile(filepath, function(err, data) {
		if(err)
			return callback('Error uploading file.', null);
		imageinfo(data, function(info) {
			if(!info || !info.width)
				return callback('Unable to get flash size. Is this a valid SWF?', null);
			Knob.CDN.uploadFile(Knob, fileStream, hash + '.swf', function(err) {
				if(err)
					return callback('Failed to upload file.', null);
				post = new Knob.Database.Post();
				post.hash = hash;
				post.file = hash + '.swf';
				post.remote = false;
				post.date = Knob.Util.convertToUTC(new Date());
				post.uploader = user;
				post.handler = 'flash';
				unprocessed_tags = tags.slice(0);
				Knob.Util.addTags(unprocessed_tags, function() {
					//by now the cache will have all the tag IDs in it
					tag_ids = [];
					for(var i=0;i<tags.length;i++)
						tag_ids[i] = Knob.Cache.getTagId(tags[i]);
					post.save(function(err) {
						query = 'UPDATE public.post SET tags=\'{' + tag_ids.join(',') + '}\' WHERE id=\'' + post.id + '\';';
						if(err)
							callback('Could not save post.', null);
						else
							Knob.Database.Schema.client.query(query, function(err, data) {
								if(err)
								{
									console.log(err);
									callback('Could not save post.', null);
								}
								else
								{
									Knob.Database.Schema.client.query('INSERT INTO public.flash_info(postid,width,height) VALUES('+post.id+','+info.width+','+info.height+');', function(err, data) {
										callback(null, post);
									});
								}
							});
					});
				});
			});
		});
	});
}

exports.renderPost = function(post, knob, callback)
{
	file = knob.CDN.getFileURL(post.file);
	knob.Database.Schema.client.query('SELECT width,height FROM public.flash_info WHERE postid='+post.id+';', function(err, data) {
		info = data.rows[0];
		var output = '<object classid=\'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000\' codebase=\'http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0\' width=\''+info.width+'\' height=\''+info.height+'\'>\n';
		output += '\t<param name=\'src\' value=\''+file+'\'>\n';
		output += '\t<embed src=\''+file+'\' width=\''+info.width+'\' height=\''+info.height+'\'>\n';
		output += '</object>';
		callback(output);
	});
}
exports.getThumbnail = function(post, knob)
{
	return knob.CDN.getFileURL('download-thumb.png');
}