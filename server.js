var express  = require('express'),
    hbs      = require('hbs'),
    passport = require('passport'),
    fs       = require('fs');

var PORT = process.env.PORT || 3001;

var Knob = {};
Knob.Config = JSON.parse(fs.readFileSync('config.json'));

Knob.Database = require('./database');
Knob.Database.initialize(Knob);

Knob.Util = require('./util');
Knob.Cache = require('./cache');
Knob.CDN = require('./plugins/cdn_' + Knob.Config.cdn);

Knob.Cache.reloadCache(Knob);
Knob.Util.setKnob(Knob);

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('site_name', function() {
	return Knob.Config.name;
});

var app = express();
app.configure(function() {
	app.set('view engine', 'hbs');
	app.set('views', __dirname + '/views');
	app.use(express.static(process.cwd() + '/public'));
	app.use(express.bodyParser());
	app.use(express.cookieParser('this is a very secret secret'));
	app.use(express.session({
		cookie: {
			expires: new Date(Date.now() + (60 * 100000)),
			maxAge: 60 * 100000
		}
	}));
});

app.listen(PORT);

Knob.App = app;
require('./routes/main').initialize(Knob);
require('./routes/user').initialize(Knob);
require('./routes/post').initialize(Knob);
Knob.CDN.initialize(Knob);

console.log('App listening on port ' + PORT);