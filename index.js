var express = require("express");
var fs = require("fs");
var http = require("http");
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
app.use(express.static(args.directory));
app.get("/", function(req, res) {
    res.send("index!");
});
app.listen(args.port);
