_ = require("./underscore.js")


var movedValue = function (elapsed, dx, x, rate) {
  return (rate * elapsed * dx) + x
}


var bman = function (state, event) {
  var elapsed = event.elapsed
  console.log("players!")
  console.log(state.players)
  _.each(event.disconnected, function (id) {
    delete state.players[id]
  })
  _.each(event.players, function (playerEvent) {
    if (playerEvent.id in state.players) {
      var player = state.players[playerEvent.id]
      player.x = movedValue(elapsed, playerEvent.dx, player.x, player.moveRate)
      player.y = movedValue(elapsed, playerEvent.dy, player.y, player.moveRate)
    } else {
      state.players[playerEvent.id] = {
        x: 4,
        y: 4,
        color: "cc0000",
        moveRate: 1/50
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


