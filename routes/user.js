var Knob, app;

var bcrypt = require('bcrypt');

function initialize(knob)
{
	Knob = knob;
	app = Knob.App;

	app.get('/user/register', function(req, res) {
		if(req.session.user)
		{
			res.redirect('/user/profile');
			return;
		}
		res.render('user/register', {title: 'Register'});
	});

	app.post('/user/register', function(req, res) {
		if(req.session.user)
		{
			res.redirect('/user/profile');
			return;
		}
		password = req.body.password;
		repassword = req.body.repassword;
		nickname = req.body.nickname;
		errors = [];
		if(!password || password.match(/^\s+$/))
			errors.push('No password provided.');
		if(!nickname || nickname.match(/^\s+$/))
			errors.push('No nickname provided.');
		if(password != repassword)
			errors.push('Passwords don\'t match.');
		Knob.Database.User.findOne({where: {nickname: nickname}}, function(err, items) {
			if(items)
				errors.push('A user has already registered with this nickname.');
			if(errors.length == 0)
			{
				var salt = bcrypt.genSaltSync(10);
				var hash = bcrypt.hashSync(password, salt);
				var user = new Knob.Database.User();
				user.nickname = nickname;
				user.password = hash;
				user.date = Knob.Util.convertToUTC(new Date());
				user.save(function(err) {
					console.log(err);
					req.session.user = user.id;
					res.redirect('/user/profile');
				});
			}
			else
				res.render('user/register', {errors: errors, title: 'Register'});
		});
	});

	app.get('/user/login', function(req, res) {
		if(req.session.user)
			res.redirect('/user/profile');
		else
			res.render('user/login', {title: 'Login'});
	});

	app.post('/user/login', function(req, res) {
		if(req.session.user)
		{
			res.redirect('/user/profile');
			return;
		}
		nickname = req.body.nickname;
		password = req.body.password;
		error = false;
		if(!nickname || nickname.match(/^\s+$/))
			error = true;
		if(!password || password.match(/^\s+$/))
			error = true;
		Knob.Database.User.findOne({where: {nickname: nickname}}, function(err, user) {
			if(!user)
				error = true;
			if(error)
				res.render('user/login', {errors: ['Invalid nickname or password']});
			else
			{
				var result = bcrypt.compareSync(password, user.password);
				if(!result)
					res.render('user/login', {errors: ['Invalid nickname or password'], title: 'Login'});
				else
				{
					req.session.user = user.id;
					res.redirect('/user/profile');
				}
			}
		});
	});

	app.get('/user/logout', function(req, res) {
		req.session.user = null;
		res.redirect('/');
	});

	app.get('/user/profile', function(req, res) {
		if(!req.session.user)
		{
			res.redirect('/user/login');
			return;
		}
		Knob.Database.User.findOne({where: {id: req.session.user}}, function(err, user) {
			if(!user)
			{
				req.session.error = {message: 'User does not exist!', code: 500};
				res.redirect('/error');
				return;
			}
			userinfo = {
				nickname: Knob.Util.formatName(user.nickname, user.role),
				date: Knob.Util.formatDate(new Date(Knob.Util.convertFromUTC(user.date)), false),
				title: 'Profile'
			};
			res.render('user/profile', userinfo);
		});
	});
}

exports.initialize = initialize;