// todo: since you are only sending changes, for new connections,
// send the whole state
_ = require("./underscore.js")
var io = require('socket.io').listen(8013, {log: false});

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
  playersPos: {},
  changesInWhereThingsAre: {}
}

playerMoveX = bman.playerMoveX
playerMoveY = bman.playerMoveY
playerGoto = bman.playerGoto
playerStop = bman.playerStop
aDown = bman.aDown
aUp = bman.aUp
onTime = bman.onTime
onDisconnect = bman.onDisconnect
onConnect = bman.onConnect

var events = {}
io.sockets.on('connection', function (socket) {
  var id = _.uniqueId("s") // TODO? use a numeric id and make it an array?

  onConnect(state, id)

  socket.on('leftdown', function () {
     playerMoveX(state, id, -1)
  });
  socket.on('leftup', function () {
     playerMoveX(state, id, 0)
  });
  socket.on('rightdown', function () {
     playerMoveX(state, id, 1)
  });

  socket.on('rightup', function () {
    playerMoveX(state, id, 0)
  });

  socket.on('updown', function () {
    playerMoveY(state, id, -1)
  });
  socket.on('upup', function () {
    playerMoveY(state, id, 0)
  });
  socket.on('downdown', function () {
    playerMoveY(state, id, 1)
  });

  socket.on('downup', function () {
    playerMoveY(state, id, 0)
  });

  socket.on("gotoPoint", function (point) {
    playerGoto(state, id, point)
  })
  socket.on("stopGoing", function (point) {
    playerStop(state, id, point)
  })
  socket.on("adown", function (point) {
    aDown(state, id, point)
  })
  socket.on("aup", function (point) {
    aUp(state, id, point)
  })

  socket.on("disconnect", function () {
    onDisconnect(state, id)
  })
});

var tick = function (state, timeEvent) {
  var now = Date.now()
  timeEvent.elapsed = now - timeEvent.time
  timeEvent.time = now
  onTime(state, timeEvent) 
  var changes = state.changesInWhereThingsAre
  if (state.hasChanges) {
    io.sockets.emit("ciwta", changes) //changes in where things are
  }
  state.hasChanges = false
  state.changesInWhereThingsAre = {}
  setTimeout(function() {
    tick(state, timeEvent)
  }, 32) 
}


var timeEvent = { time: Date.now() }
tick(state, timeEvent);


process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
  return false; 
});
