_ = require("./underscore.js")
var io = require('socket.io').listen(8012, {log: false});

var bman = require("./bman.js")

var event = {
  players: {},
  disconnected: []
}

var state = {
  field: [],
  players: {},
  bricks: {}
}

io.sockets.on('connection', function (socket) {
  var id = _.uniqueId("s")
  event.players[id] = {dx: 0, dy: 0, id: id}
  socket.emit("frame", "ff0000") 
  socket.on('leftdown', function () { event.players[id].dx = -1; });
  socket.on('leftup', function () { event.players[id].dx = 0; });
  socket.on('rightdown', function () { event.players[id].dx = 1; });
  socket.on('rightup', function () { event.players[id].dx = 0; });

  socket.on('updown', function () { event.players[id].dy = -1; });
  socket.on('upup', function () { event.players[id].dy = 0; });
  socket.on('downdown', function () { event.players[id].dy = 1; });
  socket.on('downup', function () { event.players[id].dy = 0; });

  socket.on("gotoPoint", function (point) { event.players[id].going = point; })
  socket.on("stopGoing", function (point) { event.players[id].going = null; })
  socket.on("adown", function (point) { event.players[id].a = true; })
  socket.on("aup", function (point) { event.players[id].a = false; })

  socket.on("disconnect", function () {
    delete event[id]
    event.disconnected.push(id)
  })
});


var tick = function (state, event) {
  var now = Date.now()
  event.elapsed = now - event.time
  event.time = now
  state = bman(state, event) 
  var frame = renderFrame(state)
  if (frame !== lastFrame) {
    io.sockets.emit("frame", frame)
     lastFrame = frame
  }
  setTimeout(function() {
    tick(state, event)
  }, 32) 
}

var randomColor = function () {
  return _.random(0, 0xFFFFFF).toString(16)
}

var randomFrame = function () {
  var str = ""
  var color = randomColor()
  for (var i = 0; i < 64; i++) {
    //str += randomColor();
    str += color;
  }
  return str;
}

var lastFrame = ""
var renderFrame = function (state) { 
  var ret = [];
  for (var i = 0; i < 64; i ++) {
    ret[i] = "00aa00"
  }
  _.each(state.players, function (player) {
    ret[Math.round(player.y) * 8 + Math.round(player.x)] = player.color
  })

  _.each(state.bricks, function (player) {
    ret[Math.round(player[1]) * 8 + Math.round(player[0])] = "404040"
  })
  return ret.join("")
  //return randomFrame();
}

tick(state, event);

setInterval(function() {
  state.bricks = {}
}, 5000)


process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  return false; 
});
