_ = require("./underscore.js")
var io = require('socket.io').listen(8012, {log: false});

var bman = require("./bman.js")

var event = {
  players: {},
  disconnected: []
}

var state = {
  players: {},
  bombs: {},
  flames: {}
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

  _.each(state.bombs, function (bomb) {
    ret[(bomb.y) * 8 + (bomb.x)] = "404040"
  })

  _.each(state.flames, function (flame) {
    ret[(flame.y) * 8 + (flame.x)] = "ff7F00"
  })

  return ret.join("")
  //return randomFrame();
}

tick(state, event);


process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  return false; 
});
