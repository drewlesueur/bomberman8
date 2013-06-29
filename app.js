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

playerMoveX = bman.playerMoveX
playerMoveY = bman.playerMoveY
playerGoto = bman.playerGoto
playerStop = bman.playerSotp
aDown = bman.aDown
aUp = bman.aUp
onTime = bman.onTime

var events = {}
io.sockets.on('connection', function (socket) {
  var id = _.uniqueId("s")
  event.players[id] = {dx: 0, dy: 0, id: id}
  socket.emit("frame", "f00") 
  // is all this binding slow?
  socket.on('leftdown', function () {
     playerMoveX.bind(state, id, -1)
  });
  socket.on('leftup', function () {
     playerMoveX.bind(state, id, 0)
  });
  socket.on('rightdown', function () {
     playerMoveX.bind(state, id, 1)
  });

  socket.on('rightup', function () {
    playerMoveX.bind(state, id, 0)
  });

  socket.on('updown', function () {
    playerMoveY.bind(state, id, -1)
  });
  socket.on('upup', function () {
    playerMoveY.bind(state, id, 0)
  });
  socket.on('downdown', function () {
    playerMoveY.bind(state, id, 1)
  });

  socket.on('downup', function () {
    playerMoveY.bind(state, id, 0)
  });

  socket.on("gotoPoint", function (point) {
    playerGoto.bind(state, id, point)
  })
  socket.on("stopGoing", function (point) {
    playerStop.bind(state, id, point)
  })
  socket.on("adown", function (point) {
    aDown(state, id, point)
  })
  socket.on("aup", function (point) {
    aUp(state, id, point)
  })

  socket.on("disconnect", function () {
    delete event[id]
    event.disconnected.push(id)
  })
});

var tick = function (state, timeEvent) {
  var now = Date.now()
  timeEvent.elapsed = now - timeEvent.time
  timeEvent.time = now
  onTime(state, timeEvent) 
  var changes = state.where_things_are_changes
  if (changes) {
    io.sockets.emit("wtac", changes) //wtac where-things-are changes
  }
  setTimeout(function() {
    tick(state, timeEvent)
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
  var ret = {};
  _.each(state.players, function (player) {
    ret[player.roundX + "_" + player.roundY] = player.color
  })

  _.each(state.bombs, function (bomb) {
    ret[(bomb.x)  + "_" + (bomb.y)] = "444"
  })

  _.each(state.flames, function (flame) {
    ret[(flame.x) + "_" + (flame.y)] = "f70"
  })

  return ret
  //return randomFrame();
}

var timeEvent = {
  time: Date.now()
}
tick(state, timeEvent);


process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  return false; 
});
