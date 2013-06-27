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
        state.bricks[player.x + "_" + player.y] = [player.x, player.y]
      }
    } else {
      //console.log("here! :( -- " + playerEvent.id)
      state.players[playerEvent.id] = {
        x: _.random(0, 7),
        y: _.random(0, 7),
        color: colors[_.random(0, colors.length - 1)],
        moveRate: 1/75
      }
    }
  })
  return state;       
}


// export
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = bman;
  }
}


