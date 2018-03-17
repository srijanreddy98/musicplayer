var express = require('express');
var fs = require('fs');
const http = require('http');
var readdir = require("recursive-readdir");
var hbs = require('hbs');
var pug = require('pug');
var ejs = require('ejs');
var socketIO = require('socket.io');
var app = express();
var app2 = express();
var path = require('path');
var mm = require('musicmetadata');
var _progress = require('cli-progress');
var results = [];
var os = require('os');
var ifaces = os.networkInterfaces();

var getIp () => {
	Object.keys(ifaces).forEach(function (ifname) {
		var alias = 0;

		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return false;
			}

			if (alias >= 1) {
				// this single interface has multiple ipv4 addresses
				console.log(ifname + ':' + alias, iface.address);
				return iface.address;
			} else {
				// this interface has only one ipv4 adress
				console.log(ifname, iface.address);
				return iface.address;
			}
			++alias;
		});
	});
}
var bar1 = new _progress.Bar({}, _progress.Presets.shades_classic);
function ignoreFunc(file, stats) {
	// `file` is the absolute path to the file, and `stats` is an `fs.Stats` 
	// object returned from `fs.lstat()`.
	if (stats.isDirectory()) return false;
	else {
		var a = file.split(".").reverse();
		results.push(a[0]);
		results = results.filter((v, i, a) => a.indexOf(v) === i);
		if (a[0] === 'mp3' || a[0] === 'MP3') {
			return false;
		} else {
			return true;
		}
	}
}
var count = 0;
var recur = (na, leng) => {
	 mm(fs.createReadStream(na), function (err, metadata) {
	 	if (err) {
	 		metadata.title = na.split("\\").reverse()[0];
	 	}
		 metadata['path'] = na;
		 if (metadata.picture[0]) {
		 	metadata.picture[0].data = metadata.picture[0].data.toString('base64');
		 }
		 file.push(metadata);
		 console.log(metadata.title);
		 count++;
		 bar1.update(count);
	 	if (count === leng) {
	 		file.sort(predicateBy('title'));
			 console.log('ready');
			 console.log(file[119].picture[0].data);
	 	}
	 	// console.log(metadata);

	 });
} 
var file = [];
readdir('/Users/Chintu/Music/', [ignoreFunc]).then(
	function (files) {
		bar1.start(files.length,0);
		for (i of files) {
			recur(i, files.length);
		}
	},
	function (error) {
		console.error("something exploded", error);
	}
);
function predicateBy(prop) {
	return function (a, b) {
		if (a[prop] > b[prop]) {
			return 1;
		} else if (a[prop] < b[prop]) {
			return -1;
		}
		return 0;
	}
}
app.get('/',function(req,res){
	
	return res.render('lap.ejs', {
		names: file
	});

});
app2.get('/', function (req, res) {

	return res.render('music.ejs', {names: file});

});
app.set('view engine', 'ejs');
app2.set('view engine', 'ejs');
app.use('/public', express.static(__dirname + '/public'));
app2.use('/public', express.static(__dirname + '/public'));

/** Implementing Simple Music Server using Express JS **/
app.get('/music', function(req,res){
	// File to be served
	// console.log(req.query.id);
	var fileId = req.query.id; 
	var file = fileId;
	fs.exists(file,function(exists){
		if(exists)
		{
			var rstream = fs.createReadStream(file);
			rstream.pipe(res);
		}
		else
		{
			res.send("Its a 404");
			res.end();
		}
	
	});
	
});
app2.get('/music', function (req, res) {
	// File to be served
	// console.log(req.query.id);
	var fileId = req.query.id;
	var file = fileId;
	fs.exists(file, function (exists) {
		if (exists) {
			var rstream = fs.createReadStream(file);
			rstream.pipe(res);
		} else {
			res.send("Its a 404");
			res.end();
		}

	});

});
app.get('/howler', (req, res) => res.sendFile(__dirname+ '/howler/dist/howler.js'))
app.get('/lapDownload', (req, res) => {
	return res.render('music-download.pug', {
		names: file
	});
});
app.get('/download', function(req,res){
	var fileId = req.query.id;
	var file = __dirname + '/music/' + fileId;
	fs.exists(file,function(exists){
		if(exists)
		{
			res.setHeader('Content-disposition', 'attachment; filename=' + fileId);
			res.setHeader('Content-Type', 'application/audio/mpeg3')
			var rstream = fs.createReadStream(fileId);
			rstream.pipe(res);
		}
		else
		{
			res.send("Its a 404");
			res.end();
		}
	});
	
	
});
app2.get('/downloadPage', (req, res) => {
return res.render('music-download.pug', {
	names: file
});
});
app2.get('/download', function (req, res) {
	var fileId = req.query.id;
	var file = fileId;
	file = file.split("\\Users\\Chintu\\Music")[1];
	fs.exists(fileId, function (exists) {
		if (exists) {
			// console.log(file, ' is being downloaded');
			// res.sendFile(file, {
			// 	root: '\\Users\\Chintu\\Music'
			// });
			res.setHeader('Content-disposition', 'attachment; filename=' + fileId);
			res.setHeader('Content-Type', 'application/audio/mpeg3')
			var rstream = fs.createReadStream(fileId);
			rstream.pipe(res);
		} else {
			res.send("Its a 404");
			res.end();
		}
	});


});

var server = http.createServer(app);
var server2 = http.createServer(app2);
var io = socketIO(server);
var io2 = socketIO(server2);
io.on('connection', (socket) => {console.log('new User connected');
	io2.emit('con', {});
	console.log('here2');
	io.on('cone', () => {
		console.log('IN');
		io.broadcast('pl', {});
	});
}
);
server.listen(3000, function () {
			console.log(`App listening on port 3000! for laptop`)});
var ip = getIp();
var p = ip ? ip : process.env.IP;
server2.listen(3003, p ,function () {
	console.log(`App is listening! Open ${p}:3003`);
});