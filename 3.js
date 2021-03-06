<!doctype html>
<html>
<head>
  <meta name = "viewport" content = "initial-scale = 1.0, maximum-scale=1, minimum-scale=1">
<style>
  * {
    padding: 0;
    margin: 0;
  }
</style>
</head>
<body>
<canvas id="c" width="640" height="640" style="width:320px; height:320px;"></canvas>
<script src="socket.io.js"></script>
<script src="mousetrap.js"></script>
<script>
var canvasEl = document.getElementById("c")
var c = canvasEl.getContext("2d")
c.scale(2,2)
c.fillRect(0,0,320,320)
var pixelWidth = 320 / 8
var pixelHeight = 320 / 8
var render = function (frame) {
  frame = frame.replace(/\|/g, "")
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      var color = frame.substr(((y * 8) + x) * 6, 6) 
      c.fillStyle = "#" + color
      c.fillRect(x*pixelWidth, y*pixelHeight, pixelWidth, pixelHeight)
    }
  }
}

var socket = io.connect('http://drewles.com:8012');
var state
socket.on("frame", render)

Mousetrap.bind("left", function () {
  socket.emit("leftdown")
}, 'keydown')

Mousetrap.bind("left", function () {
  socket.emit("leftup")
}, 'keyup')

Mousetrap.bind("right", function () {
  socket.emit("rightdown")
}, 'keydown')

Mousetrap.bind("right", function () {
  socket.emit("rightup")
}, 'keyup')

Mousetrap.bind("up", function () {
  socket.emit("updown")
}, 'keydown')

Mousetrap.bind("up", function () {
  socket.emit("upup")
}, 'keyup')

Mousetrap.bind("down", function () {
  socket.emit("downdown")
}, 'keydown')

Mousetrap.bind("down", function () {
  socket.emit("downup")
}, 'keyup')

Mousetrap.bind("space", function ( ){
  socket.emit("adown")
}, "keydown")

Mousetrap.bind("space", function ( ){
  socket.emit("aup")
}, "keyup")

// up down left right
var oneway = function () {
  var getDx = function(e) {
    for (var i = 0; i < e.touches.length; i++) {
      var x = e.changedTouches[i].pageX 
      var y = e.changedTouches[i].pageY 
      if (x < 160 && y < 220 && y > 100) {
        dx = -1 
      } else if (x >= 160 && y < 220 && y > 100){
        dx = 1
      } else {
        dx = 0
      }
    }
    return dx
  }
  var getDy = function(e) {
    for (var i = 0; i < e.touches.length; i++) {
      var x = e.changedTouches[i].pageX 
      var y = e.changedTouches[i].pageY 
      if (y < 160 && x < 220 && x > 100) {
        dy = -1 
      } else if (y >= 160 && x < 220 && x > 100){
        dy = 1
      } else {
        dy = 0
      }
    }
    return dy
  }

  document.body.ontouchstart = function (e) {
    var dx = 0;
    var dy = 0;
    dx = getDx(e)
    if (dx == -1) socket.emit("leftdown")
    else if (dx == 1) socket.emit("rightdown")

    dy = getDy(e)
    if (dy == -1) socket.emit("updown")
    else if (dy == 1) socket.emit("downdown")
  }

  document.body.ontouchend = function (e) {
    var dx = 0;
    var dy = 0;
    dx = getDx(e)
    if (dx == -1) socket.emit("leftup")
    else if (dx == 1) socket.emit("rightup")

    dy = getDy(e)
    if (dy == -1) socket.emit("upup")
    else if (dy == 1) socket.emit("downup")
  }
}

// try for cahnges
var otherway = function () {
  var x = 0
  var y = 0
  document.body.ontouchstart = function (e) {
    e.preventDefault();
    x = e.touches[0].pageX  
    y = e.touches[0].pageY  
    if (e.touches.length > 1) {
      socket.emit("adown")
    }
  }

  var moveTimeout = null;  
  document.body.ontouchmove = function (e) {

    var dx = e.touches[0].pageX - x
    var dy = e.touches[0].pageY - y
    //if (!(Math.abs(dx) > 1 || Math.abs(dy) > 1)) return;

    clearTimeout(moveTimeout)
    moveTimeout = setTimeout(function () {
      socket.emit("rightup")
      socket.emit("downup")
    }, 25)
    e.preventDefault();
    // trying to capture changes in movement here
    x = e.touches[0].pageX 
    y = e.touches[0].pageY

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        dx = -1
      } else {
        dx = 1
      }
      dy = 0
    } else {
      if (dy < 0) {
        dy = -1
      } else {
        dy = 1
      }
      dx = 0
    }

    if (dx == -1) socket.emit("leftdown")
    else if (dx == 1) socket.emit("rightdown")
    else if (dx == 0) socket.emit("rightup")

    if (dy == -1) socket.emit("updown")
    else if (dy == 1) socket.emit("downdown")
    else if (dy == 0) socket.emit("downup")
  }

  document.ontouchend = function (e) {
    // todo
    e.preventDefault();
    socket.emit("rightup")
    socket.emit("downup")
    if (e.touches.length > 0) {
      socket.emit("aup")
    }
  }
}


// click where you want to go
var thirdway = function () {
  var onTouch = function (e) {
    e.preventDefault()
    var pointX = Math.floor(e.touches[0].pageX / pixelWidth)
    var pointY = Math.floor(e.touches[0].pageY / pixelHeight)
    socket.emit("gotoPoint", [pointX, pointY - 2])
  }

  document.body.ontouchstart = function (e) {
    if (e.touches.length > 1) {
      socket.emit("adown")
    }
    onTouch(e);
  }
  document.body.ontouchmove = onTouch
  document.body.ontouchend = function () {
    socket.emit("stopGoing") 
      socket.emit("aup")
  }
}

var fourthway = function () {
  window.ondevicemotion = function (e) {
    // var xyz = Math.round(e.accelerationIncludingGravity.x) + " " +  Math.round(e.accelerationIncludingGravity.y) + " " + Math.round(e.accelerationIncludingGravity.z)
    //var xyz = Math.round(e.acceleration.x) + " " +  Math.round(e.acceleration.y) + " " + Math.round(e.acceleration.z)
    //document.title = xyz
    var x = Math.round(e.accelerationIncludingGravity.x)
    var y = Math.round(e.accelerationIncludingGravity.y)

    if (x <= -1) {
      socket.emit("leftdown")
    } else if (x >= 1) {
      socket.emit("rightdown")
    } else {
      socket.emit("rightup")
    }

    if (y <= 6) {
      socket.emit("updown")
    } else if (y >= 6) {
      socket.emit("downdown")
    } else {
      socket.emit("downup")
    }
  }
}

var fifthway = function () {
  var lastGamma = 0
  var lastBeta = 0
  var baseGamma = 0
  var baseBeta= 0
  var beta
  var gamma
  var startTime = 0
  document.body.ontouchstart = function (e) {
    e.preventDefault()
    startTime = Date.now()
    socket.emit("adown")
  }
  document.body.ontouchend = function (e) {
    var duration = Date.now() - startTime;

    if (duration > 1000) {
      baseBeta = beta
    }
    socket.emit("aup")
    //baseGamma = gamma
    //alert(baseGamma + " " + baseBeta)
  }
  var sensitivity = 6
  window.ondeviceorientation = function (e) {
    //document.title = Math.round(e.alpha) + "_" + Math.round(e.beta) + "_" + Math.round(e.gamma)
    beta = Math.round(e.beta)
    gamma = Math.round(e.gamma)

    if (gamma <= baseGamma-sensitivity && lastGamma >= gamma - 1) {
      socket.emit("leftdown")
    } else if (gamma >= baseGamma+sensitivity && lastGamma <= gamma + 1) {
      socket.emit("rightdown")
    } else {
      socket.emit("rightup")
    }

    if (beta <= baseBeta-sensitivity && lastBeta >= beta - 1) {
      socket.emit("updown")
    } else if (beta >= baseBeta+sensitivity && lastBeta <= beta + 1) {
      socket.emit("downdown")
    } else {
      socket.emit("downup")
    }

    lastGamma = gamma
    lastBeta = beta


    return

    if (x <= -1) {
      socket.emit("leftdown")
    } else if (x >= 1) {
      socket.emit("rightdown")
    } else {
      socket.emit("rightup")
    }

    if (y <= 6) {
      socket.emit("updown")
    } else if (y >= 6) {
      socket.emit("downdown")
    } else {
      socket.emit("downup")
    }
  }
}

var sixthway = function () {
  var onTouch = function (e) {
    e.preventDefault()
    var pointX = Math.floor((e.touches[0].pageX - 10) / (pixelWidth / 4))
    var pointY = Math.floor((e.touches[0].pageY - (160 + 80 ) + 10) / (pixelHeight /4))
    socket.emit("gotoPoint", [pointX, pointY])
  }

  document.body.ontouchstart = function (e) {
    if (e.touches.length > 1) {
      socket.emit("adown")
    }
    onTouch(e);
  }
  document.body.ontouchmove = onTouch
  document.body.ontouchend = function () {
    socket.emit("stopGoing") 
      socket.emit("aup")
  }
}

swipeway = function() {
  var x = 0;
  var y = 0;
  document.body.ontouchstart = function (e) {
    e.preventDefault();
    x = e.touches[0].pageX 
    y = e.touches[0].pageY 
  }

  document.body.ontouchmove = function (e) {
    e.preventDefault()
    newx = e.touches[0].pageX 
    newy = e.touches[0].pageY 
    var dx = newx - x
    var dy = newy - y
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      if (dx > 0) {
        socket.emit("rightdown")
      } else if (dx < 0) {
        socket.emit("leftdown")
      }
    }
  }
   
  document.body.ontouchend = function (e) {
    e.preventDefault()
    socket.emit("rightup")     
  } 
  
}



//sixthway();
thirdway();
swipeway();


</script>
</body>
