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

    //path = pathFinder.findPath(car.pos.x, car.pos.y, getInPosition.pos.x, getInPosition.pos.y, grid);
    path = findPath(car.pos.x, car.pos.y, getInPosition.pos.x, getInPosition.pos.y);
    }




function findPath(startX, startY, destX, destY){
    var startHeuristic = Math.abs( startX - destX) + Math.abs(startY - destY);
    var destination = {pos:{x:destX,y:destY}};
    var openList = [{ pos: {x:startX, y: startY}, heuristic: startHeuristic, distance: 0}];
    var closedList = [];
    var mapOfPreviousTiles = [];
    while(closedList.some(element => element.x == destX && element.y ==destY)){
        var tileToProcess = chooseTheBestTileFromList(openList);
        openList.remove(element => element.x == tileToProcess.pos.x && element.y == tileToProcess.pos.y);
        closedList.add(tileToProcess);
        var avalaibleTiles = avalaibleTilesFromProcessedTile(tileToProcess);
        for(var i = 1; i < avalaibleTiles.length; i++){
            if(openList.some(element => element.x == clalculateManhattanDistance.pos.x && element.y == avalaibleTiles[i].pos.y)){
                var tileInOpenList = openList.find(element => element.x == avalaibleTiles[i].pos.x && element.y == avalaibleTiles[i].pos.y)
                if(tileToProcess.distance + 1 + clalculateManhattanDistanc(avalaibleTiles[i],destination) < tileInOpenList.heuristic + tileInOpenList.distance){
                    var heuristic = clalculateManhattanDistance(destination, avalaibleTiles[i]);
                    var newTile = { pos: {x:avalaibleTiles[i].pos.x, y: avalaibleTiles[i].pos.y}, heuristic: heuristic, distance: tileToProcess.distance+1};
                    mapOfPreviousTiles.remove(element => element.to.pos.x == newTile.pos.x && element.to.pos.y == newTile.pos.y)
                    mapOfPreviousTiles.add({from: tileToProcess, to: newTile});
                }
            }else{
                if (!openList.some(element => element.x == avalaibleTiles[i].pos.x && element.y == avalaibleTiles[i].pos.y)){
                    var heuristic = clalculateManhattanDistance(destination, avalaibleTiles[i]);
                    var newTile = { pos: {x:avalaibleTiles[i].pos.x, y: avalaibleTiles[i].pos.y}, heuristic: heuristic, distance: tileToProcess.distance+1}
                    openList.add(newTile);
                    mapOfPreviousTiles.add({from: tileToProcess, to: newTile});
                }
            }
        }
    }
}

function clalculateManhattanDistance(from, to){
    return Math.abs( startX - destX) + Math.abs(startY - destY);
}

function avalaibleTilesFromProcessedTile(tileToProcess){
    var upCoordinate = tileToProcess.pos.y-1 > 0 ? tileToProcess.pos.y-1 : 59;
    var leftCoordinate = tileToProcess.pos.x-1 >  0 ? tileToProcess.pos.x-1 : 59;
    var rightCoordinate = tileToProcess.pos.x+1 < 60 ? tileToProcess.pos.x+1 : 0;
    var downCoordinate = tileToProcess.pos.y+1 < 60 ? tileToProcess.pos.y+1 : 0;
    return getAccessableNeighbors(upCoordinate,rightCoordinate,downCoordinate,leftCoordinate,tileToProcess);
}

function chooseTheBestTileFromList(openList){
    var tileToProcess = openList[0];
    for(var i = 1; i < openList.length; i++)
        if(openList[i].distance+openList[i].heuristic < tileToProcess.distance+tileToProcess.heuristic)
                tileToProcess = openList[i];
    return tileToProcess;
}


function findPositionToGetIn(passenger,car){

    //Ne legyen tulindexeles
    var upCoordinate = passenger.pos.y-1 > 0 ? passenger.pos.y-1 : passenger.pos.x+1;
    var leftCoordinate = passenger.pos.x-1 >  0 ? passenger.pos.x-1 :passenger.pos.x+1;
    var rightCoordinate = passenger.pos.x+1 < 60 ? passenger.pos.x+1 : passenger.pos.x-1;
    var downCoordinate = passenger.pos.y+1 < 60 ? passenger.pos.y+1 : passenger.pos.y-1;
    var accessableGetIns = getAccessableNeighbors(upCoordinate,rightCoordinate,downCoordinate,leftCoordinate,passenger);

    var closestGetIn = accessableGetIns[0];

    for(var i = 0; i < accessableGetIns.length; i++){
        if( Math.abs(accessableGetIns[i].pos.x - car.pos.x) + Math.abs(accessableGetIns[i].pos.y - car.pos.y) < Math.abs(closestGetIn.pos.x - car.pos.x) + Math.abs(closestGetIn.pos.y - car.pos.y))
            closestGetIn = accessableGetIns[i];
    }
    console.log("next destination: "+closestGetIn)
    
    return closestGetIn;
}

function getAccessableNeighbors(upCoordinate,rightCoordinate,downCoordinate,leftCoordinate,center){
    return[
        {accessable: walkable[upCoordinate][center.pos.x ], pos: {x: center.pos.x, y:upCoordinate}},
        {accessable: walkable[downCoordinate][center.pos.x ], pos: {x: center.pos.x, y:downCoordinate}},
        {accessable: walkable[center.pos.y][leftCoordinate ], pos: {x: leftCoordinate, y:center.pos.y}},
        {accessable: walkable[center.pos.y][rightCoordinate ], pos: {x: rightCoordinate, y:center.pos.y}}].filter(getIn => getIn.accessable == 0);

}