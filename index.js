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