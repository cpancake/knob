var Knob, app;

function initialize(knob)
{
	Knob = knob;
	app = Knob.App;

	app.get('/', function(req, res) {
		res.redirect('/posts');
	});
}

exports.initialize = initialize;