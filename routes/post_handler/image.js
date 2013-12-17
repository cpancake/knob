var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var handlebars = require('handlebars');

var allowedTypes = ['image/gif', 'image/jpeg', 'image/png'];
var extensions = {'image/gif': 'gif', 'image/jpeg': 'jpg', 'image/png': 'png'};
var allowedSize = 1000 * 1000 * 2; //2MB limit

exports.name = 'Image';

var Knob, template;

exports.addPost = function(req, res, knob, callback)
{
	Knob = knob;
	user = req.session.user;
	tags_str = req.body.tags;
	if(!req.files || !req.files.image)
		return callback('No image provided.', null);
	file = req.files.image;
	if(allowedTypes.indexOf(file.type) == -1)
		return callback('Image must be GIF, JPEG, or PNG.', null);
	if(file.size > allowedSize)
		return callback('Image must be 2MB or less.', null);
	if(tags_str) 
		tags = tags_str.split(',');
	else
		tags = [];
	tags = Knob.Util.sanitizeTags(tags);
	filepath = file.path;
	hash = crypto.createHash('sha1').update(Date.now().toString() + Math.random().toString()).digest('hex');
	var fileStream = fs.createReadStream(filepath);
	Knob.CDN.uploadFile(Knob, fileStream, hash + '.' + extensions[file.type], function(err) {
		if(err)
			return callback('Failed to upload file.', null);
		post = new Knob.Database.Post();
		post.hash = hash;
		post.file = hash + '.' + extensions[file.type];
		post.remote = false;
		post.date = Knob.Util.convertToUTC(new Date());
		post.uploader = user;
		post.handler = 'image';
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
							callback(null, post);
					});
			});
		});
	});
}

exports.renderPost = function(post, knob, callback)
{
	callback('<img src=\''+knob.CDN.getFileURL(post.file)+'\'>');
}

exports.getThumbnail = function(post, knob)
{
	return knob.CDN.getFileURL(post.file);
}