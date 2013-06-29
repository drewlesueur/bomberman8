// todo: event stream vs event state
_ = require("./underscore.js")
var io = require('socket.io').listen(8012, {log: false});

var dimension = 16
var pixelWidth = dimension
var pixelHeight = dimension
var pixelArea = pixelWidth * pixelHeight

var bman = require("./bman.js")

var event = {
  players: {},
  disconnected: []
}

var state = {
  players: {},
  bombs: {},
  flames: {},
  objects: {},
  playersPos: {}
}


io.sockets.on('connection', function (socket) {
  var id = _.uniqueId("s")
  event.players[id] = {dx: 0, dy: 0, id: id}
  socket.emit("frame", "f00") 
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
  for (var i = 0; i < pixelArea; i++) {
    //str += randomColor();
    str += color;
  }
  return str;
}

var lastFrame = ""
var renderFrame = function (state) { 
  var ret = [];
  for (var i = 0; i < pixelArea; i ++) {
    ret[i] = "0a0"
  }
  _.each(state.players, function (player) {
    ret[player.roundY * pixelHeight + player.roundX] = player.color
  })

  _.each(state.bombs, function (bomb) {
    ret[(bomb.y) * pixelHeight + (bomb.x)] = "444"
  })

  _.each(state.flames, function (flame) {
    ret[(flame.y) * pixelHeight + (flame.x)] = "f70"
  })

  return ret.join("")
  //return randomFrame();
}

tick(state, event);


process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  return false; 
});
