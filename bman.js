_ = require("./underscore.js")


var movedValue = function (elapsed, dx, x, rate) {
  return (rate * elapsed * dx) + x
}

var maxed = function (x) {
  return x < 0 ? 0 : x > 7 ? 7 : x
}

var moveGoing = function (elapsed, goingX, x, rate) {
  var roundedX = Math.round(x)
  var dx = goingX < roundedX ? -1 : goingX > roundedX ? 1 : 0
  newX = (rate * elapsed * dx) + x
  if (dx < 1 && newX < goingX) newX = goingX
  if (dx > 1 && newX > goingX) newX = goingX
  return newX
}


var colors = ["ffffff", "0000ff", "ff0000", "ffff00", "ff00ff", "00ffff"]
var bman = function (state, event) {
  var elapsed = event.elapsed
  //console.log("players!")
  //console.log(state.players)
  //console.log(event.disconnected)

  if (event.disconnected.length) {
    _.each(event.disconnected, function (id) {
      delete state.players[id]
      delete event.players[id] // should I mess with the event?
    })
    event.disconnected = []
  }
  _.each(event.players, function (playerEvent) {
    if (playerEvent.id in state.players) {
      var player = state.players[playerEvent.id]
      player.x = maxed(movedValue(elapsed, playerEvent.dx, player.x, player.moveRate))
      player.y = maxed(movedValue(elapsed, playerEvent.dy, player.y, player.moveRate))

      var going = playerEvent.going
      if (going) {
        var goingX = going[0]
        var goingY = going[1]
        player.x = maxed(moveGoing(elapsed, goingX, player.x, player.moveRate))
        player.y = maxed(moveGoing(elapsed, goingY, player.y, player.moveRate))
      }

      if (playerEvent.a) {
        if (player.bombs && (event.time - player.bombTime > 100)) {
          player.bombTime = event.time
          console.log("BOMB")
          var roundX = Math.round(player.x)
          var roundY = Math.round(player.y)
          var bombKey = roundX + "_" + roundY
          if (bombKey in state.bombs) {

          } else {
            player.bombs = player.bombs - 1
            state.bombs[bombKey] = {
              x: roundX,
              y: roundY,
              start: event.time,
              fuse: 2000,
              fuseLength: 3000,
              color: "404040",
              player: player
            }
          }
        } 
      }
    } else {
      //console.log("here! :( -- " + playerEvent.id)
      state.players[playerEvent.id] = {
        x: _.random(0, 7),
        y: _.random(0, 7),
        color: colors[_.random(0, colors.length - 1)],
        moveRate: 1/75,
        bombs: 3,
        bombTime: 0
      }
    }
  })

  var bombsToDelete = []
  _.each(state.bombs, function (bomb, key) {
    bomb.fuse -= elapsed 
    if (bomb.fuse <= 0) {
      bombsToDelete.push(key)
    }
  })
  _.each(bombsToDelete, function (key) {
    state.bombs[key].player.bombs += 1
    delete state.bombs[key]
  })

  return state;       
}


// export
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = bman;
  }
}


