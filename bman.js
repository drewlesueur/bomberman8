_ = require("./underscore.js")

var dimension = 320
var gridDimension = 8
var gridUnitWidth = dimension / gridDimension
var gridUnitHeight = dimension / gridDimension
var pixelWidth = dimension
var pixelHeight = dimension
var pixelWidthMinus1 = pixelWidth - 1






var movedValue = function (elapsed, dx, x, rate) {
  return (rate * elapsed * dx) + x
}

var maxed = function (w, x) {
  var maxX = pixelWidth - w
  return x < 0 ? 0 : x > maxX ? maxX : x
}

var maxedY = function (w, x) {
  var maxX = pixelWidth - w //- 100 // todo fix this hack!
  return x < 0 ? 0 : x > maxX ? maxX : x
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

var addFlame = function(state, bomb, x, y, w, h, img) {
    var flames = state.flames
    var bombs = state.bombs
    var bombsPos = state.bombsPos

    var yp2 = y + h
    var xp2 = x + w
    for (yp = y; yp < yp2; yp++) {
      for (xp = x; xp < xp2; xp++) {
        var flamePosKey = xp + "_" + yp
        if (flamePosKey in bombsPos) {
          var bomb2 = bombsPos[flamePosKey]
          if (bomb2 != bomb) {
            detinateBomb(state, bombsPos[flamePosKey], bomb2.id)
          }
        }

        if (flamePosKey in state.playersPos) {
          _.each(state.playersPos[flamePosKey], function (player){
            player.img = "d"
            player.deadTime = 0
            player.dead = true
            state.hasChanges = true
            state.changesInWhereThingsAre[player.id] = generateChange(player)
           // player.bombs = -1
          })
        }
      }
    }

    var flameId = _.uniqueId("f")
    var flame = {
      id: flameId,
      x: x * gridUnitWidth,
      y: y * gridUnitHeight,
      w: w * gridUnitWidth,
      h: h * gridUnitHeight,
      img: "f", //f for flame
      originX: 10, //TODO calculate these
      originY: 10,
      duration: 300
    }
    // TODO : maybe make the flame 4 units total. you can set the height and width?
    flames[flameId] = flame 
    state.hasChanges = true
    state.changesInWhereThingsAre[flameId] = generateChange(flame)
}

var addFlames = function (state, bomb) {
  flames = state.flames
  bombs = state.bombs
  var bombX = bomb.gridX
  var bombY = bomb.gridY
  var len = bomb.length || 5
  addFlame(state, bomb, bombX + 1, bombY, len,  1)
  addFlame(state, bomb, bombX - len, bombY, len, 1)
  addFlame(state, bomb, bombX, bombY + 1, 1, len)
  addFlame(state, bomb, bombX, bombY - len, 1, len)
}

// note there can be only 1 bomb in one spot
// unlike players that can share a spot
//
var detinateBomb = function (state, bomb, bombId) {
  bomb.player.bombs += 1
  delete state.bombs[bombId]
  delete state.bombsPos[bomb.gridX + "_" + bomb.gridY]
  state.hasChanges = true;
  state.changesInWhereThingsAre[bomb.id] = null
  addFlames(state, bomb)
}

var setplayersPos = function (state, player, gridX, gridY) {
  var key = gridX + "_" + gridY
  if (key in state.playersPos) {
    state.playersPos[key].push(player)
  } else {
    state.playersPos[key] = [player]
  }
}

var colors = ["fff", "00f", "f00", "ff0", "f0f", "0ff"]

var generateChange = function (item) {
  return Math.round(item.x) + "_" +
    Math.round(item.y) + "_" + 
    item.w + "_" +
    item.h + "_" +
    item.img
}

var getGridValue = function (x, w, originX, gridValue) {
  var midX = x + originX
  return Math.floor(midX / gridValue)
}

var bman = {};
bman.onTime = function (state, timeEvent) {
  var elapsed = timeEvent.elapsed
  //state.elapsed = timeEvent.elapsed // you might need this?
  state.time = timeEvent.time
  state.playersPos = {} // clear out the old playersPositions. you could just keep it around and change the players that move from one spot to another
  _.each(state.players, function (player, playerId) {
      if (player.dx != 0 || player.dy != 0) {
        player.x = maxed(player.w, movedValue(elapsed, player.dx, player.x, player.moveRate))
        player.y = maxedY(player.h, movedValue(elapsed, player.dy, player.y, player.moveRate))
        player.gridX = getGridValue(player.x, player.w, player.originX, gridUnitWidth)
        player.gridY = getGridValue(player.y, player.h, player.originY, gridUnitHeight)
        //setplayersPos(state, player, player.gridX, player.gridY)

        // it might be already maxed out but oh well
        state.hasChanges = true
        // TODO: round?
        state.changesInWhereThingsAre[playerId] = generateChange(player)
      }

      var going = player.going
      if (going) {
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
        // TODO: hthis might not have changed, you could prob optimize this
        player.gridX = getGridValue(player.x, player.w, player.originX, gridUnitWidth)
        player.gridY = getGridValue(player.y, player.h, player.originY, gridUnitHeight)
        //setplayersPos(state, player, player.gridX, player.gridY)

        state.hasChanges = true
        // todo: maybe have a global where things are
        state.changesInWhereThingsAre[playerId] = generateChange(player)
      }

      if (player.dead) {
        player.deadTime += elapsed
        if (player.deadTime >= 2000) {
          player.dead = false
          player.img = player.originalImg
          state.hasChanges = true
          state.changesInWhereThingsAre[playerId] = generateChange(player)
        }
      }
      // todo you could maybe use a setPlayersPos when the position chagnes, but then you would have to clear out the old ones.
      // that woudl probably be faster?
      setplayersPos(state, player, player.gridX, player.gridY)
  }) 

  if (state.first) {
      state.first = false

      var player = {
        x: 100,
        y: 100,
        originX: 8,
        originY: 16,
        img: "p8",
        originalImg: "p8",
        moveRate: 1/2,
        dx: 0,
        dy: 0,
        w: 16,
        h: 24,
        bombs: 10,
        bombTime: 0,
        id: "badguy"
      }

      state.players["badguy"] = player

      state.changesInWhereThingsAre["badguy"] = generateChange(player)
      state.hasChanges = true
  }

  var bombsPos = state.bombsPos
  var bombs = state.bombs
  _.each(bombs, function (bomb, bombId) {
    bomb.fuse -= elapsed 
    if (bomb.fuse <= 0) {
      detinateBomb(state, bomb, bombId)
    }
  })


  _.each(state.flames, function (flame, key) {
    flame.duration -= elapsed 
    if (flame.duration <= 0) {
      delete state.flames[key]
      state.hasChanges = true;
      state.changesInWhereThingsAre[flame.id] = null 
    }
  })

} 

bman.playerMoveX = function (state, id, direction) {
  state.players[id].dx = direction
} 

bman.playerMoveY = function (state, id, direction) {
  state.players[id].dy = direction
} 

bman.playerGoto = function (state, id, point) {
  player = state.players[id]
  point[0] = Math.round(point[0] - (player.w / 2))
  point[1] = Math.round(point[1] - (player.h / 2))
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

var touchPadWay = function () {
  bman.onTouchStart = function (state, id, points) {
    var player = state.players[id]
    player.touchStartX = points[0]
    player.touchStartY = points[1]
    player.playerStartX = player.x
    player.playerStartY = player.y
    player.lastMovedX = points[0]
    player.lastMovedY = points[1]
    player.touchStarts += 1;
    if (player.touchStarts > 1) {
      bman.aDown(state, id)
    }
  } 

  bman.onTouchMove = function (state, id, points) {
    // was here
    var player = state.players[id]
    var x = points[0]
    var y = points[1]
    player.lastMovedX = x
    player.lastMovedY = y
    return bman.playerGoto(state, id, [player.playerStartX + (x - player.touchStartX) + player.w /2 ,
        player.playerStartY + (y - player.touchStartY) + player.h / 2])

  }

  bman.onTouchEnd = function (state, id) {
    var player = state.players[id]
    player.dx = 0
    player.dy = 0
    player.going = false;
    player.touchStarts -= 1
    if (Math.abs(player.lastMovedX - player.touchStartX) <= 5 && Math.abs(player.lastMovedY - player.touchStartY) <= 5)  {
      bman.aDown(state, id)
    }
  }
}

var dpadWay = function () {
  var dpadCenterX = 50
  var dpadCenterY = 320 - 50

  var inDPadBounds = function (x, y) {
    return x < (320 / 2)
  }

  var dpadValue = function (x, centerX, dx) {
    var diffX = x - centerX  
    return diffX < -25 ? -1 : diffX > 25 ? 1 : 0
  }

  var onTouchAny = function(state, id, points) {
    var x = points[0]
    var y = points[1]
    var player = state.players[id]
    if (points.length > 2) {
      bman.aDown(state, id)
    }
    if (inDPadBounds(x, y)) {
      player.dx = dpadValue(x, dpadCenterX, player.dx)
      player.dy = dpadValue(y, dpadCenterY, player.dy)
    } else {
      bman.aDown(state, id)
    }
  } 
  
  bman.onTouchStart = onTouchAny 
  bman.onTouchMove = onTouchAny

  bman.onTouchEnd = function (state, id, points) {
    var x = points[0]
    var y = points[1]
    var player = state.players[id]
    if (inDPadBounds(x, y)) {
      player.dx = 0
      player.dy = 0
    }
  }
}

touchPadWay()
//dpadWay()

bman.moveDiff = function (state, id, point) {
 // was here
        var x = point[0]
        var y = point[1]
        var player = state.players[id]
        player.x = maxed(player.w, player.x + x)
        player.y = maxedY(player.h, player.y + y)
        player.gridX = getGridValue(player.x, player.w, player.originX, gridUnitWidth)
        player.gridY = getGridValue(player.y, player.h, player.originY, gridUnitHeight)

        state.hasChanges = true
        state.changesInWhereThingsAre[player.id] = generateChange(player)
} 

bman.playerStop = function (state, id, point) {
  state.players[id].going = false
  state.players[id].dx = 0
  state.players[id].dy = 0
} 

bman.aDown = function (state, id) {
  var player = state.players[id]
  var x = player.gridX
  var y = player.gridY
  //if (player.bombs > 0 && (state.time - player.bombTime > 100)) {
  if (player.bombs > 0 ) {
    player.bombTime = state.time
    var bombKey = x + "_" + y
    if (bombKey in state.bombs) {

    } else {
      // was here
      player.bombs = player.bombs - 1
      var bombId = _.uniqueId("b")
      var bomb = {
        id: bombId, // b for bomb
        x: x * gridUnitWidth,
        y: y * gridUnitHeight,
        gridX: x,
        gridY: y,
        w: 40,
        h: 40,
        originX: 10,
        originY: 10,
        img: "b",
        start: state.time,
        fuse: 3000,
        color: "444",
        player: player,
        length: 15
      }

      state.bombs[bombId] = bomb
      state.hasChanges = true
      state.changesInWhereThingsAre[bombId] = generateChange(bomb)
      state.bombsPos[bomb.gridX + "_" + bomb.gridY] =  bomb
    }
  } 
} 

bman.aUp = function (state) {

} 


bman.onDisconnect = function (state, id) {
  delete state.players[id]
  state.hasChanges = true;
  state.changesInWhereThingsAre[id] = null
} 

var playerImages = ["p", "p2", "p3", "p4", "p5", "p6", "p7"] //, "p8"]
var playerImageIndex = 0
var nextPlayer = function () {
  var playerImage = playerImages[playerImageIndex]
  playerImageIndex += 1
  if (playerImageIndex >= playerImages.length) {
    playerImageIndex = 0
  }
  return playerImage
}

bman.onConnect = function (state, id) {
  var img = nextPlayer()
    // 0_0
  var player = {
    touchStarts: 0,
    x: 100,
    y: 100,
    originX: 8,
    originY: 16,
    img: img,
    originalImg: img,
    moveRate: 1/1,
    dx: 0,
    dy: 0,
    w: 32,
    h: 48,
    bombs: 10,
    bombTime: 0,
    id: id
  }
  state.players[id] = player

  state.changesInWhereThingsAre[id] = generateChange(player)
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


  return state;       
}


// export
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = bman;
  }
}


