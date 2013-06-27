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

var addFlame = function(state, x, y) {
    var flames = state.flames
    var bombs = state.bombs
    var flameKey = x + "_" + y
    if (flameKey in bombs) {
      detinateBomb(state, bombs[flameKey], flameKey)
    }
    if (flameKey in state.playerPos) {
      _.each(state.playerPos[flameKey], function (player){
        player.color = "7f7f7f"
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
  for (var i = bombX + 1; i < 8; i++) {
    addFlame(state, i, bombY)
  }   
  for (var i = bombY - 1; i >= 0; i--) {
    addFlame(state, bombX, i)
  }   
  for (var i = bombY + 1; i < 8; i++) {
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
              color: "404040",
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
        bombs: 3,
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


