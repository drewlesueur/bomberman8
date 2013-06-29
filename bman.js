_ = require("./underscore.js")

var dimension = 320
var pixelWidth = dimension
var pixelHeight = dimension
var pixelWidthMinus1 = pixelWidth - 1


var movedValue = function (elapsed, dx, x, rate) {
  return (rate * elapsed * dx) + x
}

var maxed = function (x) {
  return x < 0 ? 0 : x > pixelWidthMinus1 ? pixelWidthMinus1 : x
}

var moveGoing = function (elapsed, dx, goingX, x, rate) {
  newX =  x + (elapsed * rate * dx)

  //var roundedX = Math.round(x)
  var roundedX = x
  newX = (rate * elapsed * dx) + x
  if (dx < 1 && newX <= goingX) newX = goingX
  if (dx > 1 && newX >= goingX) newX = goingX
  return newX
}

var addFlame = function(state, x, y) {
    var flames = state.flames
    var bombs = state.bombs
    var flameKey = x + "_" + y
    if (flameKey in bombs) {
      detinateBomb(state, bombs[flameKey], flameKey)
    }
    if (flameKey in state.playerPos) {
      _.each(state.playerPos[flameKey], function (player){
        player.color = "777"
        player.bombs = -1
      })
    }
    flames[flameKey] = {
      x: x,
      y: y,
      duration: 300
    } 
}

var addFlames = function (state, bomb) {
  flames = state.flames
  bombs = state.bombs
  var bombX = bomb.x
  var bombY = bomb.y
  for (var i = bombX - 1; i >= 0; i--) {
    addFlame(state, i, bombY)
  }   
  for (var i = bombX + 1; i < pixelWidth; i++) {
    addFlame(state, i, bombY)
  }   
  for (var i = bombY - 1; i >= 0; i--) {
    addFlame(state, bombX, i)
  }   
  for (var i = bombY + 1; i < pixelHeight; i++) {
    addFlame(state, bombX, i)
  }   
}

var detinateBomb = function (state, bomb, key) {
  state.bombs[key].player.bombs += 1
  delete state.bombs[key]
  addFlames(state, bomb)
}

var setPlayerPos = function (state, player, x, y) {
  var key = x + "_" + y
  
} 
var colors = ["fff", "00f", "f00", "ff0", "f0f", "0ff"]

var bman = {};
bman.onTime = function (state, timeEvent) {
  var elapsed = timeEvent.elapsed
  _.each(state.players, function (player, playerId) {
      if (player.dx != 0 || player.dy != 0) {

        player.x = maxed(movedValue(elapsed, player.dx, player.x, player.moveRate))
        player.y = maxed(movedValue(elapsed, player.dy, player.y, player.moveRate))

        // it might be already maxed out but oh well
        state.hasChanges = true
        // TODO: round?
        state.changesInWhereThingsAre[playerId] = Math.round(player.x) + "_" + Math.round(player.y) + "_" + player.img
      }

      var going = player.going
      if (going) {
        // todo. just set dx and dy earler and here just determine when to stop
        var goingX = going[0]
        var goingY = going[1]
        if (player.dx == -1 && player.x < goingX) {
          player.dx = 0 
          player.x = goingX
        } else if (player.dx == 1 && player.x > goingX) {
          player.dx = 0 
          player.x = goingX
        }

        if (player.dy == -1 && player.y < goingY) {
          player.dy = 0 
          player.y = goingY
        } else if (player.dy == 1 && player.y > goingY) {
          player.dy = 0 
          player.y = goingY
        }

        state.hasChanges = true
        state.changesInWhereThingsAre[playerId] = Math.round(player.x) + "_" + Math.round(player.y) + "_" + player.img
      }
  }) 


          /*
      var going = playerEvent.going
      if (going) {
        var goingX = going[0]
        var goingY = going[1]
        player.x = maxed(moveGoing(elapsed, goingX, player.x, player.moveRate))
        player.y = maxed(moveGoing(elapsed, goingY, player.y, player.moveRate))
      }
      var roundX = Math.round(player.x)
      var roundY = Math.round(player.y)
      player.roundX = roundX
      player.roundY = roundY
      player.key = roundX + "_" + roundY
      
      setPlayerPos(state, player, roundX, roundY)
      */
   
} 

bman.playerMoveX = function (state, id, direction) {
  state.players[id].dx = direction
} 

bman.playerMoveY = function (state, id, direction) {
  state.players[id].dy = direction
} 

bman.playerGoto = function (state, id, point) {
  player = state.players[id]
  player.going = point
  if (point[0] > player.x) {
    player.dx = 1
  } else if (point[0] < player.x) {
    player.dx = -1
  } else {
    player.dx = 0
  }

  if (point[1] > player.y) {
    player.dy = 1
  } else if (point[1] < player.y) {
    player.dy = -1
  } else {
    player.dy = 0
  }
} 

bman.playerStop = function (state, id, point) {
  state.players[id].going = false
  state.players[id].dx = 0
  state.players[id].dy = 0
} 

bman.aDown = function (state, id) {

} 

bman.aUp = function (state) {

} 


bman.onDisconnect = function (state) {

} 

bman.onConnect = function (state, id) {
  state.players[id] = {
    x: 0,
    y: 0,
    color: "f00",
    img: "bomber",
    moveRate: 1,
    dx: 0,
    dy: 0
  }
  state.changesInWhereThingsAre[id] = "0_0_bomber"
  state.hasChanges = true
} 

var bmanOld = function (state, event) {
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
      var roundX = Math.round(player.x)
      var roundY = Math.round(player.y)
      player.roundX = roundX
      player.roundY = roundY
      player.key = roundX + "_" + roundY
      
      setPlayerPos(state, player, roundX, roundY)
      

      if (playerEvent.a) {
        if (player.bombs > 0 && (event.time - player.bombTime > 100)) {
          player.bombTime = event.time
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
              color: "444",
              player: player
            }
          }
        } 
      }
    } else {
      //console.log("here! :( -- " + playerEvent.id)
      state.players[playerEvent.id] = {
        x: 0,
        y: 0,
        roundX: 0,
        roundY: 0,
        key: "0_0",
        color: colors[_.random(0, colors.length - 1)],
        moveRate: 1/50,
        //moveRate: 1/100,
        bombs: 10,
        bombTime: 0
      }
    }
  })

  state.playerPos = {}
  _.each(state.players, function (player, key) {
    if (player.key in state.playerPos) {
      state.playerPos[player.key].push(player)
    } else {

    state.playerPos[player.key] = [player]
    }
  })

  _.each(state.bombs, function (bomb, key) {
    bomb.fuse -= elapsed 
    if (bomb.fuse <= 0) {
      detinateBomb(state, bomb, key)
    }
  })


  var flamesToDelete = []
  _.each(state.flames, function (flame, key) {
    flame.duration -= elapsed 
    if (flame.duration <= 0) {
      flamesToDelete.push(key)
    }
  })

  _.each(flamesToDelete, function (key) {
    delete state.flames[key]
  })



  return state;       
}


// export
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = bman;
  }
}


