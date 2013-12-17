# knob

Image booru using Node.js and Postgres. Work in progress. Probably not the best idea to use at this point, but hey, I can't stop you.

## Installation
Clone this repository into a new directory. Clone [cpancake/node-imageinfo](https://github.com/cpancake/node-imageinfo) into node_modules/imageinfo. Rename config.template.json to config.json, and change the settings. Move public/img/download-thumb.png to /cdn/. Import knob.sql to your Postgres database. Run server.js. Enjoy.

## Config
There aren't many config options at the moment, but here's what there is at the moment:

* _name_: The name of the booru.
* _cdn_: The CDN plugin in use.
* _database_: The _storage_ key is the main database to use. Once a caching system is implemented, there will be a key for a caching database (like Redis, Riak, etc).

## Plugins
The only type of plugin in the plugins directory that will be loaded right now are CDN plugins. The _cdn_ key in the config sets which file will be loaded. Setting it to 'basic' will load cdn\_basic.js. Setting it to s3 will load cdn\_s3.js (if it existed, which it does not, at the moment).

### Writing a CDN plugin.
Take a look at the cdn\_basic.js plugin for reference. This is a dummy CDN plugin, that just moves each uploaded file to the /cdn/ directory and registers the route /cdn/:file as mapping to this directory. It's not a real CDN, it's just good for testing. 

When implementing a CDN plugin, you need to implement these module functions:

* `initialize` - Takes one argument, `Knob`. This variable contains all the modules used in the application. Knob.Database is database.js, Knob.Cache is cache.js, etc. Check server.js to see them all.
* `uploadFile` - Takes the arguments `Knob`, `stream`, `file`, and `callback`. Knob is the Booru global, as seen above. Stream is the stream to the uploaded file. File is the name of the uploaded file, like 8e40bf258d8c2990d80df0c2f73715ee163664f3.jpg. Callback is the callback to run when the file is uploaded, which takes one argument, `err`. Set `err` to null if there's no error.
* `getFileURL` - Takes one argument, `file`. This is the name of the file, like the one seen above. Return the full URL to this file.

## Post Handlers
These should really be moved under plugins, which it probably will be soon. Right now, they're contained in routes/post_handler. These are modules that dictate what kinds of posts can be posted. There are two handlers at the moment, image.js and flash.js, for image posts and flash posts. 

### Writing a Post Handler
Your post handler needs to handle adding and rendering the post. To write a post handler, you need to implement these functions:

* `addPost` - Takes four arguments - `req`,`res`,`Knob`,`callback`. `req` and `res` are the same as the parameters from Express. `Knob` is the Booru global. `callback` is the callback that should be called when the post adding is complete. `addPost` is called when a user tries to add a post. This function needs to validate the request, upload the file to CDN, and add the post to the database (as well as adding tags). Callback is called with the parameters `err` and `post`, where `err` is an error if it occurred and `post` is the post object (from the database). Check image.js as a reference.
* `renderPost` - Takes three arguments - `post`, `Knob`, and `callback`. `post` is the post object from the database. `Knob` is the Booru global. `callback` is the callback to be called when the post is rendered. You can use `knob.CDN.getFileURL(post.file)` to get the URL to the file in the post.
* `getThumbnail` - Takes two arguments - `post` and `Knob`, which are the same as the parameters to the previous function (but no callback). Should return whatever thumbnail should be used for the file, such as a resized version of the original or just a default thumb for the post.