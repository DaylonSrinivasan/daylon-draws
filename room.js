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
    socket.emit('message', {type: 'get_current_drawing'});
});

socket.on('message', function (data) {
    // The 'message' event is emitted whenever another client sends a message
    // Messages are automatically broadcasted to everyone in the room
    //socket.emit('message', 'this is a response message!');

    switch(data.type){
        case 'click':
            points.push(data.point);
            redraw();
            break;
        case 'get_current_drawing':
            socket.emit('message', {type: 'current_drawing', points: points, use_surprise_color: use_surprise_color});
            break;
        case 'current_drawing':
            points=data.points;
            use_surprise_color=data.use_surprise_color;
            if(use_surprise_color)
                setTimeout(surpriseColorShift, 100);
            redraw();
            break;
        case 'clear':
            points.length=0;
            redraw();
            break;
        case 'surprise':
            use_surprise_color = data.use_surprise_color;
            if(use_surprise_color)
                setTimeout(surpriseColorShift, 100);
            redraw();

            break;
    }

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




class Point{

    constructor(x, y, drag, color, size, user_id){
        this.x=x;
        this.y=y;
        this.drag=drag;
        this.size = size;
        this.color=color;
        this.surpriseColor=generateRandomColor();
        this.erasing=erasing;
        this.user_id=user_id;
    }
}

var context = document.getElementById("canvas").getContext("2d");
var points = new Array();
var paint;
var color = generateRandomColor();
var size = 30;
var use_surprise_color;
var erasing = false;
var user_id = Math.floor((Math.random() * 100) + 1);

function addClick(x, y, dragging)
{
    current_drawing = true;

    var p = new Point(x, y, dragging, color, size, user_id);
    points.push(p);
    socket.emit('message', {type: 'click', point: p });

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
    context.lineJoin = "round";

    for(var i=0; i < points.length; i++) {
        context.beginPath();

        //connect point to last point by same user (if dragging)
        if(points[i].drag && i){
            var j = i-1;
            while(points[j].user_id!=points[i].user_id&&j>0)
                j--;
            if(j>0){
                context.moveTo(points[j].x, points[j].y);
            }
            else{
                context.moveTo(points[i].x-1, points[i].y);
            }
        }else{
            context.moveTo(points[i].x-1, points[i].y);
        }


        context.lineTo(points[i].x, points[i].y);
        context.closePath();
        context.lineWidth=points[i].size;
        if(points[i].erasing)
            context.strokeStyle = "#FFFFFF";
        else
            context.strokeStyle = use_surprise_color ? points[i].surpriseColor : points[i].color;
        context.stroke();
    }

}

function setSize(size) {
    switch(size){
        case "small":
            this.size=10;
            break;
        case "medium":
            this.size=30;
            break;
        case "large":
            this.size=50;
            break;
        default: break;
    }
}

function clearSlate() {
    points.length=0;
    socket.emit('message', {type: 'clear'});
    redraw();
}

function randomizeColor() {
    color = generateRandomColor();
}

function generateRandomColor(){
    return "#"+Math.random().toString(16).substr(-6);
}

function surpriseColorShift() {

        for(var i = 0; i < points.length-1; i++){
                points[i].surpriseColor=points[i+1].surpriseColor;
        }
        if(points.length>0)
            points[points.length-1].surpriseColor=generateRandomColor();

        redraw();
        if(use_surprise_color)
            setTimeout(surpriseColorShift, 100);
}

function surprise() {
    use_surprise_color=!use_surprise_color;
    if(use_surprise_color)
        setTimeout(surpriseColorShift, 100);
    socket.emit('message', {type: 'surprise', use_surprise_color: use_surprise_color});
}

$("#erasertoggle").change(function(){
    document.getElementById('erasertoggle').checked ? erasing = true: erasing = false;
});
