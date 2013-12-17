var dateFormat = require('dateformat'),
    escape     = require('escape-html'),
    datetime   = require('datetime');
var Knob;

exports.convertToUTC = function(date)
{
	return date.getTime();
}

exports.convertFromUTC = function(timestamp)
{
	utc = timestamp - new Date().getTimezoneOffset();
	return new Date(utc);
}

exports.formatDate = function(date, includeTime)
{
	if(includeTime === undefined || includeTime)
		return dateFormat(date, "mmmm dS, yyyy, h:MM:ss TT");
	else
		return dateFormat(date, "mmmm dS, yyyy");
}

exports.formatAgo = function(date)
{
	return datetime.formatAgo(date);
}

exports.formatName = function(name, role)
{
	cache = Knob.Cache.getRole(role);
	return '<span class=\'username\' style=\'color:' + cache.color + ';\'>' + escape(name) + '</span>';
}

exports.setKnob = function(_knob)
{
	Knob = _knob;
}

exports.sanitizeTags = function(tags)
{
	good_tags = [];
	for(var i=0;i<tags.length;i++)
	{
		tag = tags[i].replace(' ', '_').toLowerCase();
		if(/^[A-Za-z0-9_\-:]+$/.test(tag) && good_tags.indexOf(tag) == -1)
			good_tags.push(tag);
	}
	return good_tags;
}

exports.addTags = function(tags, callback)
{
	tag = tags.pop();
	if(tag == undefined)
	{
		callback();
		return;
	}
	Knob.Database.Tag.findOne({where: {name: tag}}, function(err, data) {
		if(err || !data)
		{
			newTag = new Knob.Database.Tag();
			newTag.name = tag;
			newTag.save(function(err) {
				Knob.Cache.setTag(newTag.id, tag);
				Knob.Util.addTags(tags, callback);
			});
		}
		else
		{
			Knob.Cache.setTag(data.id, tag);
			Knob.Util.addTags(tags, callback);
		}
	});
}