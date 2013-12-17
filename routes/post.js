var PAGE_SIZE = 30;
var PAGE_PADDING = 2;

var Knob, app;

function initialize(knob)
{
	Knob = knob;
	app = Knob.App;

	app.get('/posts', function(req, res) {
		page = req.query.page || 1;
		offset = (page * PAGE_SIZE) - PAGE_SIZE;
		Knob.Database.Schema.client.query('SELECT * FROM public.post ORDER BY date DESC LIMIT '+PAGE_SIZE+' OFFSET ' + offset + ';', function(err, data) {
			if(err){
				console.log(err);
				return res.render('post/search', {error: 'There was an error during the search'});}
			if(data.rows.length == 0)
				return res.render('post/search', {none_found: true});
			posts = [[]];
			handlers = Knob.Cache.getPostHandlers();
			row = 0;
			all_tags = [];
			for(var i=0;i<data.rows.length;i++)
			{
				post = data.rows[i];
				handler = handlers[post.handler];
				posts[row].push({
					id: post.id,
					thumbnail: handler.getThumbnail(post, knob)
				});
				for(var j=0;j<post.tags.length;j++)
				{
					tag = post.tags[j];
					if(all_tags.indexOf(tag) != -1) continue;
					all_tags.push(tag);
				}
				if(posts[row].length >= 5)
				{
					row += 1;
					posts[row] = [];
				}
			}
			Knob.Database.Schema.client.query('SELECT name, (SELECT COUNT(*) FROM public.post WHERE tags@>ARRAY[tag.id]) AS count FROM public.tag WHERE id=ANY(ARRAY['+all_tags.join(',')+']) ORDER BY count DESC LIMIT 20;', function(err, data) {
				if(err)
					return res.render('post/search', {error: 'There was an error during the search'});
				tags = [];
				for(var i=0;i<data.rows.length;i++)
					tags.push(data.rows[i]);
				var pages = [];
				var pages_end = [];
				var count = data.rows[0].count;
				var total_pages = Math.ceil(count / PAGE_SIZE);
				for(var i=0;(i<PAGE_PADDING + 1 && i < total_pages);i++)
					if(i < PAGE_PADDING + 1)
						pages.push(i + 1);
				if(pages.length < total_pages)
				{
					if(total_pages - pages.length > 1)
						pages_end = [total_pages - 1, total_pages];
					else
						pages_end = [total_pages];
				}
				else
					pages_end = false;
				res.render('post/search', {count: data.rows.length, pages: pages, pages_end: pages_end, posts: posts, tags: tags, query: '', posts_page: true});
			});
		});
	});
	app.get('/search', function(req, res) {
		query = req.query.q;
		page = req.query.page || 1;
		offset = (page * PAGE_SIZE) - PAGE_SIZE;
		if(!query) return res.redirect('/posts');
		start = new Date().getTime();
		blacklist_tags = [];
		tags = Knob.Database.escape(query).split(' ');
		for(var k in tags)
		{
			tag = tags[k];
			if(tag.substr(0, 1) == '-')
			{
				blacklist_tags.push(tag.substr(1, tag.length));
				tags[k] = tag.substr(1, tag.length);
			}
		}
		tags = tags.join('\',\'');
		// find the IDs for the tags in the query
		Knob.Database.Schema.client.query('SELECT id,name FROM public.tag WHERE name=ANY(ARRAY[\''+tags+'\']);', function(err, data) {
			if(err)
				return res.render('post/search', {error: 'There was an error during the search'});
			else if(data.rows.length < query.split(' ').length) //One or more tags don't exist, that means that there will be no images with these tags. We can ignore this search.
				return res.render('post/search', {none_found: true});
			else
			{
				tags = data.rows;
				tag_ids = [];
				tag_lookup = {};
				for(var i=0;i<tags.length;i++)
				{
					tag_ids[i] = tags[i].id;
					tag_lookup[tags[i].name] = tags[i].id;
				}
				not = "";
				if(blacklist_tags.length > 0)
				{
					b = [];
					for(var k in blacklist_tags)
					{
						tag = tag_lookup[blacklist_tags[k]];
						b.push(tag);
						tag_ids.splice(tag_ids.indexOf(tag), 1);
					}
					not = ' AND NOT tags@>ARRAY['+b.join(',')+']';
				}
				Knob.Database.Schema.client.query('SELECT * FROM public.post WHERE tags@>ARRAY['+tag_ids.join(',')+']'+not+' ORDER BY date DESC LIMIT '+PAGE_SIZE+' OFFSET ' + offset + ';', function(err, data) {
					if(err){
						console.log(err);
						return res.render('post/search', {error: 'There was an error during the search'});}
					if(data.rows.length == 0)
						return res.render('post/search', {none_found: true});
					posts = [[]];
					handlers = Knob.Cache.getPostHandlers();
					row = 0;
					all_tags = [];
					for(var i=0;i<data.rows.length;i++)
					{
						post = data.rows[i];
						handler = handlers[post.handler];
						posts[row].push({
							id: post.id,
							thumbnail: handler.getThumbnail(post, knob)
						});
						for(var j=0;j<post.tags.length;j++)
						{
							tag = post.tags[j];
							if(all_tags.indexOf(tag) != -1) continue;
							all_tags.push(tag);
						}
						if(posts[row].length >= 5)
						{
							row += 1;
							posts[row] = [];
						}
					}
					// find all tags involved and the totals of all the posts under them.
					Knob.Database.Schema.client.query('SELECT name, (SELECT COUNT(*) FROM public.post WHERE tags@>ARRAY[tag.id]) AS count FROM public.tag WHERE id=ANY(ARRAY['+all_tags.join(',')+']) ORDER BY count DESC LIMIT 20;', function(err, data) {
						if(err)
							return res.render('post/search', {error: 'There was an error during the search'});
						tags = [];
						for(var i=0;i<data.rows.length;i++)
							tags.push(data.rows[i]);
						var pages = [];
						var pages_end = [];
						var count = data.rows[0].count;
						var total_pages = Math.ceil(count / PAGE_SIZE);
						for(var i=0;(i<PAGE_PADDING + 1 && i < total_pages);i++)
							if(i < PAGE_PADDING + 1)
								pages.push(i + 1);
						if(pages.length < total_pages)
						{
							if(total_pages - pages.length > 1)
								pages_end = [total_pages - 1, total_pages];
							else
								pages_end = [total_pages];
						}
						else
							pages_end = false;
						res.render('post/search', {count: data.rows.length, pages: pages, pages_end: pages_end, posts: posts, tags: tags, time: ((new Date().getTime()) - start) / 1000, query: req.query.q});
					});
				});
			}
		});
	});

	app.get('/post/new', function(req, res) {
		if(!req.session.user)
		{
			res.redirect('/user/login');
			return;
		}
		handlers = [];
		postHandlerCache = Knob.Cache.getPostHandlers();
		for(var k in postHandlerCache)
		{
			handler = postHandlerCache[k];
			handlers.push({name: handler.name, id: k});
		}
		res.render('post/new', {handlers: handlers});
	});

	app.post('/post/new', function(req, res) {
		if(!req.session.user) return res.redirect('/user/login');
		handler = req.body.handler;
		if(!Knob.Cache.getPostHandlers()[handler])
			return res.render('error', {message: 'Handler doesn\'t exist! This should never happen.'});
		res.redirect('/post/new/' + handler);
	});

	app.get('/post/new/:handler', function(req, res) {
		if(!req.session.user) return res.redirect('/user/login');
		handler = req.params.handler;
		if(!Knob.Cache.getPostHandlers()[handler])
			return res.render('error', {message: 'Handler doesn\'t exist! That\'s not good.'});
		res.render('post/handlers/' + handler, {handler: handler});
	});

	app.post('/post/new/:handler', function(req, res) {
		if(!req.session.user) return res.redirect('/user/login');
		handler = req.params.handler;
		postHandlerCache = Knob.Cache.getPostHandlers();
		if(!postHandlerCache[handler])
			return res.render('error', {message: 'Handler doesn\'t exist! That\'s not good.'});
		postHandlerCache[handler].addPost(req, res, Knob, function(err, post) {
			if(err || !post) return res.render('post/handlers/' + handler, {error: err});
			res.redirect('/post/' + post.id);
		});
	});

	app.get('/post/edit/:id', function(req, res) {
		if(!req.session.user) return res.redirect('/user/login');
		id = req.params.id;
		Knob.Database.Post.findOne({where: {id: id}}, function(err, post) {
			if(err || !post)
				return res.render('post/not_found');
			Knob.Database.Schema.client.query('SELECT id,name FROM public.tag WHERE id=ANY((SELECT tags FROM public.post WHERE id='+id+')::integer[]);', function(err, data) {
				rows = data.rows;
				tags = [];
				for(var i=0;i<rows.length;i++)
					tags.push(rows[i].name);
				res.render('post/edit', {tags: tags.join(',')});
			});
		});
	});

	app.post('/post/edit/:id', function(req, res) {
		if(!req.session.user) return res.redirect('/user/login');
		id = req.params.id;
		tags_input = Knob.Util.sanitizeTags(req.body.tags.split(','));
		Knob.Database.Post.findOne({where: {id: id}}, function(err, post) {
			if(err || !post)
				return res.render('post/not_found');
			Knob.Database.Schema.client.query('SELECT tags FROM public.post WHERE id='+id+';', function(err, data) {
				rows = data.rows[0].tags;
				tags = [];
				for(var i=0;i<rows.length;i++)
					tags.push(rows[i]);
				Knob.Database.Schema.client.query('INSERT INTO public.tag_revisions(postid,userid,tags) VALUES('+id+','+req.session.user+',ARRAY['+tags.join(',')+']);', function(err) {
					console.log(err);
					Knob.Util.addTags(tags_input.slice(0), function() {
						tag_ids = [];
						for(var i=0;i<tags_input.length;i++)
							tag_ids[i] = Knob.Cache.getTagId(tags_input[i]);
						Knob.Database.Schema.client.query('UPDATE public.post SET tags=ARRAY['+tag_ids.join(',')+'] WHERE id='+id+';', function(err) {
							res.redirect('/post/' + id);
						});
					});
				});
			});
		});
	});

	app.get('/post/:id', function(req, res) {
		id = req.params.id;
		Knob.Database.Post.findOne({where: {id: id}}, function(err, post) {
			if(err || !post)
				res.render('post/not_found');
			else
			{
				//Select all tags and the counts of those tags
				Knob.Database.Schema.client.query('SELECT id,name,(SELECT COUNT(*) FROM public.post WHERE tags@>ARRAY[tag.id]) FROM public.tag WHERE id=ANY((SELECT tags FROM public.post WHERE id='+id+')::integer[]) ORDER BY name;', function(err, data) {
					tags = data.rows;
					Knob.Database.User.findOne({where: {id: post.uploader}}, function(err, user) {
						handler = Knob.Cache.getPostHandlers()[post.handler];
						handler.renderPost(post, knob, function(content) {
							res.render('post/view', {
								id:   post.id,
								tags: tags, 
								hash: post.hash, 
								file: post.file, 
								date: Knob.Util.formatAgo(new Date(Knob.Util.convertFromUTC(post.date)), false),
								content: content,
								uploader: user.nickname
							});
						});
					})
				});
			}
		})
	});
}

exports.initialize = initialize;