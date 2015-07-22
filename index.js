"use strict";
var async = require("async");
var express = require("express");
var fs = require("fs");
var http = require("http");
var path = require("path");
var yargs = require("yargs");

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
    ], function(err, results) {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).send("yay" + results);
    });
});
app.use(express.static(args.directory));
app.listen(args.port);
