let socket_io = require('socket.io');
let io = socket_io();
let socketAPI = {};
//Your socket logic here

io.on("connect", (socket) => {

    console.log("Hey :D");
    socket.emit("msg", "HEY!");

    //socket.emit("updateMarch", 3);

});


socketAPI.io = io;
module.exports = socketAPI;