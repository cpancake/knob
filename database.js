var Schema = require('jugglingdb').Schema;

var Post, User, Role, Tag, schema;

exports.initialize = function(Knob)
{
	schema = new Schema('postgres', {
		username: Knob.Config.database.storage.username,
		password: Knob.Config.database.storage.password,
		database: Knob.Config.database.storage.database,
		host:     Knob.Config.database.storage.host,
		port:     Knob.Config.database.storage.port
	});

	Post = schema.define('post', {
		id:         {type: Number},
		hash:       {type: Schema.Text, default: ''},
		file:       {type: Schema.Text, default: ''},
		remote:     {type: Boolean,     default: false},
		remote_url: {type: Schema.Text, default: ''},
		date:       {type: Number},
		handler:    {type: Schema.Text, default: 'image'},
		uploader: 	{type: Number},
		approver:   {type: Number,      default: 0}
	});

	User = schema.define('user', {
		id:         {type: Number},
		nickname:   {type: Schema.Text, default: ''},
		password:   {type: Schema.Text, default: ''},
		role:       {type: Number,      default: 0},
		date: 		{type: Number}
	});

	Role = schema.define('roles', {
		id:    {type: Number},
		name:  {type: Schema.Text},
		color: {type: Schema.Text}
	});

	Tag = schema.define('tag', {
		id:   {type: Number},
		name: {type: Schema.Text}
	});

	exports.Role = Role;
	exports.Post = Post;
	exports.User = User;
	exports.Tag = Tag;
	exports.Schema = schema;
}
exports.escape = function(val) 
{
	if (val === undefined || val === null)
		return 'NULL';
	switch (typeof val) {
		case 'boolean': 
			return (val) ? 'true' : 'false';
		case 'number': 
			return val+'';
	}
	if (typeof val === 'object')
		val = (typeof val.toISOString === 'function') ? val.toISOString() : val.toString();

	val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
		switch(s) {
			case "\0": 
				return "\\0";
			case "\n": 
				return "\\n";
			case "\r": 
				return "\\r";
			case "\b": 
				return "\\b";
			case "\t": 
				return "\\t";
			case "\x1a": 
				return "\\Z";
			default: 
				return "\\"+s;
		}
	});
	return val;
}