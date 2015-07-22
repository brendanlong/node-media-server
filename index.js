"use strict";
var async = require("async");
var express = require("express");
var fs = require("fs");
var http = require("http");
var mime = require("mime");
var mu = require("mu2");
var path = require("path");
var yargs = require("yargs");

var thisPath = path.dirname(__filename);
mu.root = path.join(thisPath, "templates");

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
        return this.slice(0, str.length) == str;
    };
}

function titleFromPath(file) {
    return path.basename(file, path.extname(file)).replace(/_/g, " ");
}

var args = yargs
    .option("d", {
        alias: "directory",
        demand: true,
        describe: "The directory to serve media from",
        type: "string",
        requiresArg: true
    })
    .option("p", {
        alias: "port",
        describe: "The port to run on",
        default: 8080,
        type: "number",
        requiresArg: true
    })
    .help("h").alias("h", "help")
    .epilog("By Brendan Long <b.long@cablelabs.com> at CableLabs, Inc.")
    .argv;

var app = express();
app.get("/", function(req, res) {
    async.waterfall([
        fs.readdir.bind(fs, args.directory),
        function(files, callback) {
            async.filter(files, function(file, callback) {
                var fullPath = path.join(args.directory, file);
                fs.stat(fullPath, function(err, stats) {
                    callback(!err && stats.isFile());
                });
            }, callback);
        }
    ], function(files) {
        var contentList = [];
        for (var i = 0; i < files.length; ++i) {
            var file = files[i];
            var type = mime.lookup(file).split("/")[0];
            var tag = null;
            if (type == "audio" || type == "video") {
                tag = type;
            } else if (type == "image") {
                tag = "img";
            } else {
                continue;
            }
            var content = {
                title: titleFromPath(file),
                link: "/" + type + "/" + file,
                path: "/content/" + file,
                tag: tag
            };
            contentList.push(content);
        }
        var stream = mu.compileAndRender("index.html", {content: contentList});
        res.status(200);
        stream.pipe(res);
    });
});
app.get("/video/:file", function(req, res) {
    var file = req.params.file;
    var stream = mu.compileAndRender("video.html", {
        title: titleFromPath(file),
        path: "/content/" + file
    });
    res.status(200);
    stream.pipe(res);
});
app.delete("/content/:file", function(req, res) {
    var file = req.params.file;
    fs.unlink(path.join(args.directory, file), function(err) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.sendStatus(200);
        }
    });
});
app.use("/content", express.static(args.directory));
app.use("/static", express.static(path.join(thisPath, "static")));
app.listen(args.port);
