var net = require('net');
var PF = require('pathfinding');
var fs  = require("fs");

var map = fs.readFileSync('map.txt').toString().split("\n").map(item => item.trim());
var map2DWithLetters = map.map(x => x.split(''));

var client = new net.Socket();
token = "XCm41v5wXaM3TzNraLdRNIoHH159v1PXaQiE2ARfNDmF1RQuxmYzTCm3HJWGuGsuGckiDuw";

var walkable = map.map(x => x.split('').map(x => (x == 'S' || x == 'Z') ? 0 : 1))
var grid = new PF.Grid(walkable);


var pathFinder = new PF.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true
});

var path;


client.connect(12323, '31.46.64.35', function() {
	client.write(JSON.stringify({token}));
});

client.on('data', function(data) {
    data = JSON.parse(data.toString());
    setPath(data);
    client.write(JSON.stringify({request_id: data.request_id, command: "NO_OP"}));
});

client.on('close', function() {
	console.log('Connection closed');
});

function setPath(data){
    if(path != undefined)
        return;
    if(data.transported > 0){
        setPathToPassengerDest(data);
    }else{
        setPathToNextPassenger(data);
    }
    optimizeDiagonalRoadSection();
}
function setPathToPassengerDest(data){
    var car = data.cars.find(car => car.id == 0);
    var passenger = data.passengers.find(pass => pass.id == car.passenger_id);
    path = pathFinder.findPath(car.pos.x, car.pos.y,passenger.dest_pos.x , passenger.dest_pos.y, grid);
}

function setPathToNextPassenger(data){
    var car = data.cars.find(car => car.id == 0);
    var passenger = data.passengers[0];
    var getInPosition = findPositionToGetIn(passenger,car);

    path = pathFinder.findPath(car.pos.x, car.pos.y, getInPosition.pos.x, getInPosition.pos.y, grid);
    }

function optimizeDiagonalRoadSection(){
    console.log("distance: "+path.length);
}

function findPositionToGetIn(passenger,car){
    var possibleGetIns = [
        {accessable: walkable[passenger.pos.y-1][passenger.pos.x ], pos: {x: passenger.pos.x, y:passenger.pos.y-1}},
        {accessable: walkable[passenger.pos.y+1][passenger.pos.x ], pos: {x: passenger.pos.x, y:passenger.pos.y+1}},
        {accessable: walkable[passenger.pos.y][passenger.pos.x-1 ], pos: {x: passenger.pos.x-1, y:passenger.pos.y}},
        {accessable: walkable[passenger.pos.y][passenger.pos.x+1 ], pos: {x: passenger.pos.x+1, y:passenger.pos.y}}];
    var accessableGetIns = possibleGetIns.filter(getIn => getIn.accessable == 0);
    var closestGetIn = accessableGetIns[0];

    for(var i = 0; i < accessableGetIns.length; i++){
        if( Math.abs(accessableGetIns[i].pos.x - car.pos.x) + Math.abs(accessableGetIns[i].pos.y - car.pos.y) < Math.abs(closestGetIn.pos.x - car.pos.x) + Math.abs(closestGetIn.pos.y - car.pos.y))
            closestGetIn = accessableGetIns[i];
    }
    console.log("next destination: "+closestGetIn)
    
    return closestGetIn;
}