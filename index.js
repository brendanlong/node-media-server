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
            var content = {
                title: path.basename(file, path.extname(file)),
                link: "/video?" + file
            };
            var type = mime.lookup(file);
            contentList.push(content);
        }
        var stream = mu.compileAndRender("index.html", {content: contentList});
        res.status(200);
        stream.pipe(res);
    });
});
app.use("/content", express.static(args.directory));
app.use("/static", express.static(path.join(thisPath, "static")));
app.listen(args.port);
