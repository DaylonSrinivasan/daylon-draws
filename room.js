var base = 'http://clicktime.herokuapp.com:80/rooms/';
var roomName = 'daylons-room';    // Replace this with your own room name

var socket = io.connect(base + roomName);

/**
 * These are the events that the websocket server will emit
 *
 * When sending messages, make sure the type is set to 'message', or other clients won't receive your data
 * (e.g. socket.emit('message', { ... }); )
 */
socket.on('welcome', function () {
    // Connection is established, start using the socket
});

socket.on('message', function (data) {
    // The 'message' event is emitted whenever another client sends a message
    // Messages are automatically broadcasted to everyone in the room
    //socket.emit('message', 'this is a response message!');

    clickX.push(data.x);
    clickY.push(data.y);
    clickDrag.push(data.dragging);
    redraw();
});

socket.on('heartbeat', function () {
    // You can listen on this event to make sure your connection is receiving events correctly
    // The server will emit a heartbeat every 30 seconds to all connected clients
});

socket.on('error', function (err) {
    // Sometimes things go wrong!
    var type = err.type;    // This is the type of error that occurred
    var message = err.message;    // This is a friendly message that should describe the error
});


//mycode
var context = document.getElementById("canvas").getContext("2d");
var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
  socket.emit('message', {x: x, y: y, dragging: dragging});

}

$('#canvas').mousedown(function(e) {

    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;

    paint = true;
    addClick(mouseX, mouseY);
    redraw();
});

$('#canvas').mousemove(function(e){
  if(paint){
    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
    redraw();
  }
});

$('#canvas').mouseleave(function(e){
  paint = false;
});

$('#canvas').mouseup(function(e){
  paint = false;
});

function redraw(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;

  for(var i=0; i < clickX.length; i++) {
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
     }else{
       context.moveTo(clickX[i]-1, clickY[i]);
     }
     context.lineTo(clickX[i], clickY[i]);
     context.closePath();
     context.stroke();
  }
}
