var express = require('express');


let test = (app, io) => {
    var router = express.Router();
    router.get("/", (req, res, next) => {
        console.log("TEST");
        io.sockets.emit("msg", "TEST");
        res.type("json");
        res.send({info: "a"});
    });
    return router;
}

module.exports = test;