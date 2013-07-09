var root = (typeof window == "undefined") ? global : window

var viewDimension = 640
var gridDimension = 10 //10 // because my sprites are 8 * 8, this number shold be divisible by 80 (640/8)

root.config = {
  viewWidth: viewDimension,
  viewHeight: viewDimension,
  gridWidth: gridDimension,
  gridHeight: gridDimension,
  port: 8016
}


