var net = require('net');
var PF = require('pathfinding');
var fs  = require("fs");

var map = fs.readFileSync('map.txt').toString().split("\n").map(item => item.trim());
var map2DWithLetters = map.map(x => x.split(''));path

var client = new net.Socket();
token = "XCm41v5wXaM3TzNraLdRNIoHH159v1PXaQiE2ARfNDmF1RQuxmYzTCm3HJWGuGsuGckiDuw";

var walkable = map.map(x => x.split('').map(x => (x == 'S' || x == 'Z') ? 0 : 1))

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
    car = data.cars.filter(x => !x.id)[0]
    carPos = car.pos;
    var dest = pavementToRoad(walkable, data.passengers[0].pos);
    
    // console.log('DEEEST', dest, data.passengers[0].pos);
    console.log('FIND PATH', carPos.x, carPos.y, dest[0], dest[1]);

    var grid = new PF.Grid(walkable);
    var pp = pathFinder.findPath(carPos.x, carPos.y, dest[0], dest[1], grid)

    console.log('FOUND PATH', pp.length, carPos.x, carPos.y, dest[0], dest[1])
    dx = car.pos.x - pp[1][0]
    dy = car.pos.y - pp[1][1]
    // var pp = pathFinder.findPath(3, 3, 57, 57, grid)
    var mwithpp = addPath(walkable, pp, [[carPos.x, carPos.y]], [ dest ]);
    printMap(mwithpp);

    operation  = getMove(car.direction, dx, dy)
    if(car.speed == 1 && operation == 'ACCELERATION')
        operation = 'NO_OP'
    console.log(car.direction, dx, dy, operation, car.speed)
    // setPath(data);
    setTimeout(x => {
        client.write(JSON.stringify({request_id: data.request_id, command: operation}));
        console.log('SENT:', operation)
    }, 1000);
});

client.on('close', function() {
	console.log('Connection closed');
});




function addPath(matrix, path, spec, target) {
    var tmp = [];
    for(line of matrix) {
        tt = [];
        for(c of line) {
            tt.push(c)
        }
        tmp.push(tt)
    }

    for(step of path) {
        tmp[step[1]][step[0]] = 2
    }
    for(step of spec) {
        tmp[step[1]][step[0]] = 3
    }
    for(step of target) {
        tmp[step[1]][step[0]] = 4
    }
    return tmp;    
}

function printMap(map) {
    console.log(map.map(x => x.map(x => {
        if (x == 1)
            return 'P'
        else if (x == 2)
            return '.'
        else if (x == 3)
            return 'O'
        else if (x == 4)
            return 'X'
        else 
            return ' '
    }).join('')));
}

function pavementToRoad(m, pos) {
    x = pos.x
    y = pos.y
    if(!m[y][x])
        return [x, y];
    else if(x > 0 && !m[y][x - 1])
        return [x-1, y];
    else if(y > 0 && !m[y-1][x])
        return [x, y-1];
    else if(x < m[0].length && !m[y][x+1])
        return [x+1, y];
    else if(y < m.length && !m[y+1][x])
        return [x, y+1];
    else if(x > 0 && y > 0 && !m[y-1][x - 1])
        return [x-1, y-1];
    else if(x < m[0].length && y < m.length && !m[y+1][x+1])
        return [x+1, y+1];
}


function getMove(direction, dx, dy) {
    if (direction == 'UP') {
        if(dy == 1)
            return 'ACCELERATION';
        else if (dx == 1)
            return 'GO_RIGHT';
        else if (dx == -1)
            return 'GO_LEFT';
        else 
            return 'GO_LEFT';
        

    }
    if (direction == 'DOWN') {
        if(dy == -1)
            return 'ACCELERATION';
        else if (dx == 1)
            return 'GO_RIGHT';
        else if (dx == -1)
            return 'GO_LEFT';
        else 
            return 'GO_RIGHT';
        
    }
    if (direction == 'LEFT') {
        if(dx == 1)
            return 'ACCELERATION';
        else if (dy == 1)
            return 'GO_RIGHT';
        else if (dy == -1)
            return 'GO_LEFT';
        else 
            return 'GO_LEFT';
    }
    if (direction == 'RIGHT') {
        if(dx == -1)
            return 'ACCELERATION';
        else if (dy == 1)
            return 'GO_LEFT';
        else if (dy == -1)
            return 'GO_RIGHT';
        else 
            return 'GO_RIGHT';
    }
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