var roleCache = {}, postHandlerCache = {}, tagCache = {}, tagCacheId = {};

var cacheTypes = {
	Role: 0
};

var fs = require('fs');

exports.getRole = function(role)
{
	return roleCache[role];
}

exports.getPostHandlers = function()
{
	return postHandlerCache;
}

exports.getTagId = function(tag)
{
	return tagCache[tag];
}

exports.getTagName = function(id)
{
	return tagCacheId[id];
}

exports.setTag = function(id, tag)
{
	tagCache[tag] = id;
	tagCacheId[id] = tag;
}

exports.flushCache = function(type)
{
	if(!type)
	{
		return;
	}
	else if(type == cacheTypes.Role)
		roleCache = {};
}

exports.reloadCache = function(Knob)
{
	roleCache = {};
	postHandlerCache = {};
	Knob.Database.Role.all(function(err, items) {
		items.forEach(function(item) {
			roleCache[item.id] = {name: item.name, color: item.color};
		});
	});
	fs.readdir('routes/post_handler', function(err, files) {
		files.forEach(function(file) {
			postHandlerCache[file.substr(0, file.lastIndexOf('.'))] = require('./routes/post_handler/' + file);
		});
	});
}

exports.CacheTypes = cacheTypes;