var net = require('net');
var PF = require('pathfinding');
var fs  = require("fs");

var map = fs.readFileSync('map.txt').toString().split("\n").map(item => item.trim());
var map2DWithLetters = map.map(x => x.split(''));path

var client = new net.Socket();
token = "XCm41v5wXaM3TzNraLdRNIoHH159v1PXaQiE2ARfNDmF1RQuxmYzTCm3HJWGuGsuGckiDuw";

var walkable = map.map(x => x.split('').map(x => (x == 'S' || x == 'Z') ? 0 : 1))
var grid = new PF.Grid(walkable);


var pathFinder = new PF.AStarFinder({
    allowDiagonal: false,
    dontCrossCorners: true
});

var path;

client.connect(12323, '31.46.64.35', function() {
	client.write(JSON.stringify({token}));
});

client.on('data', function(data) {
    data = JSON.parse(data.toString());
    // console.log(data);
    
    carPos = data.cars.filter(x => !x.id)[0].pos;
    dest = pavementToRoad(walkable, data.passengers[0].pos);
    var pp = pathFinder.findPath(carPos.x, carPos.y, dest[0], dest[1], grid)
    
    // var pp = pathFinder.findPath(3, 3, 57, 57, grid)
    
    var mwithpp = addPath(walkable, pp, [ dest ]);
    printMap(mwithpp);

    // console.log(pp.length);
    console.log(carPos, dest)

    // console.log(data.passengers[0].pos)
    // setPath(data);
    // client.write(JSON.stringify({request_id: data.request_id, command: "NO_OP"}));
});

client.on('close', function() {
	console.log('Connection closed');
});




function addPath(matrix, path, spec) {
    console.log('spec', spec)
    var tmp = [];
    for(line of matrix)
        tmp.push(line)

    for(step of path) {
        tmp[step[1]][step[0]] = 2
    }
    for(step of spec) {
        console.log(step);
        tmp[step[1]][step[0]] = 3
    }
    return tmp;    
}

function printMap(map) {
    console.log(map.map(x => x.map(x => {
        if (x == 1)
            return '_'
        else if (x == 2)
            return '.'
        else if (x == 3)
            return 'O'
        else 
            return ' '
    }).join('')));
}

function pavementToRoad(m, pos) {
    x = pos.x
    y = pos.y
    
    if(x > 0 && !m[y][x - 1])
        return [x-1, y];
    else if(y > 0 && !m[y-1][x])
        return [x, y-1];
    else if(x > 0 && y > 0 && !m[y-1][x - 1])
        return [x-1, y-1];

    else if(x < m[0].length && !m[y][x+1])
        return [x+1, y];
    else if(y < m.length && !m[y+1][x])
        return [x, y+1];
    else if(x < m[0].length && y < m.length && !m[y+1][x+1])
        return [x+1, y+1];
}








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