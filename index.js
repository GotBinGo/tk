var net = require('net');
var PF = require('pathfinding');
var fs  = require("fs");

var map = fs.readFileSync('map.txt').toString().split("\n").map(item => item.trim());
var map2DWithLetters = map.map(x => x.split(''));

var client = new net.Socket();
token = "XCm41v5wXaM3TzNraLdRNIoHH159v1PXaQiE2ARfNDmF1RQuxmYzTCm3HJWGuGsuGckiDuw";

var walkable = map.map(x => x.split('').map(x => (x == 'S' || x == 'Z') ? 0 : 1))

var path = [];
var pathEnd = {pos:{x:3,y:3}};

client.connect(12323, '31.46.64.35', function() {
	client.write(JSON.stringify({token}));
});

/*var testList = [1,2,3,4,5,6,7,8,9]
console.log(testList.splice(1,testList.length))*/


client.on('data', function(data) {
    data = JSON.parse(data.toString());
    calculateNewCarPos(data);
    car = data.cars.filter(x => !x.id)[0]
    carPos = car.pos;
    
    setPath(data);
    path.push(pathEnd);

    var command;
    if(path.length > 1){
        if(car.speed == 0&&!car.command=="+"){
            dx = car.pos.x - path[0].pos.x;
            dy = car.pos.y - path[0].pos.y;
            command  = getMove(car.direction, dx, dy);
        }else{
            
            dx = path[0].pos.x - path[1].pos.x;
            dy = path[0].pos.y - path[1].pos.y;
            
            command  = getMove2(getDirAtCommand(car.direction,car.command), dx, dy);

        }


        //var mwithpp = addPath(walkable, path.map(x => [x.pos.x,x.pos.y]), [[carPos.x, carPos.y]],[]);
        // var mwithpp = addPath(walkable, path.map(x => [x.pos.x,x.pos.y]), [], [[path[path.length-1].x, path[path.length-1].y]]);
        //printMap(mwithpp);

        if((car.speed >= 1 || car.command == "+") && (command == 'ACCELERATION' || command == 'FULL_THROTTLE'))
            command = 'NO_OP'
    }else if(path.length == 1){
        command = 'DECELERATION';

    }



    //client.write(JSON.stringify({request_id: data.request_id, command: command}));

    //console.log('prev car ifnos  ',car.command+"  ",car.direction+"  ",car.speed,car.life,car.transported,data.tick);
    //console.log('SENT:', command +"  ",dx + "  ",dy);
    //console.log(carPos,"  ",path[0])
    //console.log()
    client.write(JSON.stringify({request_id: data.request_id, command: command}));
    /*setTimeout(x => {
        client.write(JSON.stringify({request_id: data.request_id, command: command}));

    }, 1);*/
});

client.on('close', function() {
	console.log('Connection closed');
});


function calculateNewCarPos(data){
    car = data.cars.filter(x => !x.id)[0]
    if(car.speed > 0 || car.command == "+"){
        if(car.direction == 'LEFT')
            car.pos.x--;
        if(car.direction == 'RIGHT')
            car.pos.x++;
        if(car.direction == 'UP' )
            car.pos.y--;
        if(car.direction == 'DOWN')
            car.pos.y++;
        car.pos.x += 60;
        car.pos.y += 60;
        car.pos.x = car.pos.x % 60;
        car.pos.y = car.pos.y % 60;
    }
    else
        return data;
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

function getDirAtCommand(direction,command){
    if(command == '0' || command =='+' || command == '-')
        return direction;
    if (direction == 'UP'){
        if(command =='>'){
            return 'RIGHT';
        }
        if(command == '<'){
            return 'LEFT';
        }
    } else if (direction == 'DOWN'){
        if(command =='<'){
            return 'RIGHT';
        }
        if(command == '>'){
            return 'LEFT';
        }
    } else if (direction == 'LEFT'){
        if(command =='>'){
            return 'UP';
        }
        if(command == '<'){
            return 'DOWN';
        }
    } else if (direction == 'RIGHT'){
        if(command =='>'){
            return 'DOWN';
        }
        if(command == '<'){
            return 'UP';
        }
    }
}

function getMove(direction, dx, dy) {
    if (direction == 'UP') {
        if(dy == 1 ||dy== -59)
            return 'ACCELERATION';
        else if (dx == 1 || dx== -59)
            return 'GO_LEFT';
        else if (dx == -1 ||dx== 59)
            return 'GO_RIGHT';
        else 
            return 'GO_LEFT';
        

    }
    if (direction == 'DOWN') {
        if(dy == -1|| dy==59)
            return 'ACCELERATION';
        else if (dx == 1 ||dx== -59)
            return 'GO_RIGHT';
        else if (dx == -1||dx==59)
            return 'GO_LEFT';
        else 
            return 'GO_RIGHT';
        
    }
    if (direction == 'LEFT') {
        if(dx == 1||dx== -59)
            return 'ACCELERATION';
        else if (dy == 1||dy== -59)
            return 'GO_RIGHT';
        else if (dy == -1||dy== 59)
            return 'GO_LEFT';
        else 
            return 'GO_LEFT';
    }
    if (direction == 'RIGHT') {
        if(dx == -1||dx== 59)
            return 'ACCELERATION';
        else if (dy == 1||dy== -59)
            return 'GO_LEFT';
        else if (dy == -1|| dy==59)
            return 'GO_RIGHT';
        else 
            return 'GO_RIGHT';
    }
}
function getMove2(direction, dx, dy) {
    if (direction == 'UP') {
        if(dy == 1||dy==- 59)
            return 'ACCELERATION';
        else if (dx == 1||dx==- 59)
            return 'CAR_INDEX_LEFT';
        else if (dx == -1||dx== 59)
            return 'CAR_INDEX_RIGHT';
        else 
            return 'CAR_INDEX_LEFT';
    }
    if (direction == 'DOWN') {
        if(dy == -1||dy== 59)
            return 'ACCELERATION';
        else if (dx == 1||dx==- 59)
            return 'CAR_INDEX_RIGHT';
        else if (dx == -1||dx== 59)
            return 'CAR_INDEX_LEFT';
        else 
            return 'CAR_INDEX_RIGHT';
    }
    if (direction == 'LEFT') {
        if(dx == 1||dx==- 59)
            return 'ACCELERATION';
        else if (dy == 1||dy==- 59)
            return 'CAR_INDEX_RIGHT';
        else if (dy == -1||dy==59)
            return 'CAR_INDEX_LEFT';
        else 
            return 'CAR_INDEX_LEFT';
    }
    if (direction == 'RIGHT') {
        if(dx == -1|| dx==59)
            return 'ACCELERATION';
        else if (dy == 1||dy==- 59)
            return 'CAR_INDEX_LEFT';
        else if (dy == -1|| dy==59)
            return 'CAR_INDEX_RIGHT';
        else 
            return 'CAR_INDEX_RIGHT';
    }
}

//console.log(getDirAtCommand('DOWN','>'))

function getDirAtCommand(direction,command){
    if(command == '0' || command =='+' || command == '-')
        return direction;
    if (direction == 'UP'){
        if(command =='>'){
            return 'RIGHT';
        }
        if(command == '<'){
            return 'LEFT';
        }
    } else if (direction == 'DOWN'){
        if(command =='>'){
            return 'LEFT';
        }
        if(command == '<'){
            return 'RIGHT';
        }
    } else if (direction == 'LEFT'){
        if(command =='>'){
            return 'UP';
        }
        if(command == '<'){
            return 'DOWN';
        }
    } else if (direction == 'RIGHT'){
        if(command =='>'){
            return 'DOWN';
        }
        if(command == '<'){
            return 'UP';
        }
    }
}

function setPath(data){
    var car = data.cars.find(car => car.id == 0);
    if(car.passenger_id ){
        setPathToPassengerDest(data);
    }else{
        setPathToNextPassenger(data);
    }
}


function setPathToPassengerDest(data){
    var car = data.cars.find(car => car.id == 0);
    var passengers = data.passengers.find(pass => pass.id == car.passenger_id);
    
    var getInPosition = findPositionToGetIn({pos: passengers.dest_pos},car);

    if(getInPosition == undefined){
        getInPosition = findPositionToGetIn({pos: passengers.dest_pos},car,true);

        var smoothGetIn = findPositionToGetIn({pos: passengers.dest_pos},car);
        path = findPath(car.pos.x, car.pos.y, smoothGetIn.pos.x, smoothGetIn.pos.y);
        path.push(getInPosition);
    }else{
        path = findPath(car.pos.x, car.pos.y,getInPosition.pos.x, getInPosition.pos.y);
    }
    if(path.length>2){
        pathEnd.pos.x = path[path.length-2].pos.x - path[path.length-1].pos.x;
        pathEnd.pos.y = path[path.length-2].pos.y - path[path.length-1].pos.y;
    }
}

function setPathToNextPassenger(data){
    var car = data.cars.find(car => car.id == 0);
    var passenger = data.passengers[0];
    var getInPosition = findPositionToGetIn(passenger,car);

    if(getInPosition == undefined){
        getInPosition = findPositionToGetIn(passenger,car,true);
        var smoothGetIn = findPositionToGetIn(getInPosition,car);
        path = findPath(car.pos.x, car.pos.y, smoothGetIn.pos.x, smoothGetIn.pos.y);
        path.push(getInPosition);
    }else{
        path = findPath(car.pos.x, car.pos.y, getInPosition.pos.x, getInPosition.pos.y);
    }
    if(path.length>2){
        pathEnd.pos.x = path[path.length-2].pos.x - path[path.length-1].pos.x;
        pathEnd.pos.y = path[path.length-2].pos.y - path[path.length-1].pos.y;
    }
}

//console.log(findPath(3,3,57,57));

//console.log( avalaibleTilesFromProcessedTile({pos:{x:3,y:3}}));

function findPath(startX, startY, destX, destY){
    var destination = { pos:  {x:destX, y:destY}};
    var startPoint = { pos: {x:startX, y: startY}, heuristic: clalculateHeuristic({ pos: {x:startX, y: startY}},{pos:  {x:destX, y:destY}}), distance: 0};
    var openList = [startPoint];
    var closedList = [];
    var mapOfPreviousTiles = [];

    while(!closedList.some(element => element.pos.x == destX && element.pos.y ==destY)){
        var tileToProcess = chooseTheBestTileFromList(openList);
        var indexOfNewTile = openList.findIndex(element => element.pos.x == tileToProcess.pos.x && element.pos.y == tileToProcess.pos.y);
        openList.splice(indexOfNewTile,1);
        closedList.push(tileToProcess);
        var avalaibleTiles = avalaibleTilesFromProcessedTile(tileToProcess);

        for(var i = 0; i < avalaibleTiles.length; i++){
            if(openList.some(element => element.pos.x == avalaibleTiles[i].pos.x && element.pos.y == avalaibleTiles[i].pos.y)){
                var routeToProcessedTile = mapOfPreviousTiles.find(element => element.to.pos.x == tileToProcess.pos.x && element.to.pos.y == tileToProcess.pos.y);

                var tileInOpenList = openList.find(element => element.pos.x == avalaibleTiles[i].pos.x && element.pos.y == avalaibleTiles[i].pos.y);
                var maybeBetterWayValue = tileToProcess.distance + 1 + clalculateHeuristic(avalaibleTiles[i],destination);
                //if(isThereTurn(routeToProcessedTile,avalaibleTiles[i]))
                //    maybeBetterWayValue++;
                if(maybeBetterWayValue < tileInOpenList.heuristic + tileInOpenList.distance){
                    var heuristic = clalculateHeuristic(destination, avalaibleTiles[i]);
                    var newTile = { pos: {x:avalaibleTiles[i].pos.x, y: avalaibleTiles[i].pos.y}, heuristic: heuristic, distance: tileToProcess.distance+1};
                    
                    //if(isThereTurn(routeToProcessedTile,avalaibleTiles[i]))
                    //    newTile.distance++;
                    var indexOfTile = mapOfPreviousTiles.findIndex(element => element.to.pos.x == newTile.pos.x && element.to.pos.y == newTile.pos.y)
                    openList.splice(indexOfTile,1);
                    mapOfPreviousTiles.push({from: tileToProcess, to: newTile});
                }
            }else{
                if (!closedList.some(element => element.pos.x == avalaibleTiles[i].pos.x && element.pos.y == avalaibleTiles[i].pos.y)){
                    var heuristic = clalculateHeuristic(destination, avalaibleTiles[i]);
                    var newTile = { pos: {x:avalaibleTiles[i].pos.x, y: avalaibleTiles[i].pos.y}, heuristic: heuristic, distance: tileToProcess.distance+1};
                    
                    if(mapOfPreviousTiles.some(element => element.to.pos.x == tileToProcess.pos.x && element.to.pos.y == tileToProcess.pos.y)){
                        var routeToProcessedTile = mapOfPreviousTiles.find(element => element.to.pos.x == tileToProcess.pos.x && element.to.pos.y == tileToProcess.pos.y);
                        //if(isThereTurn(routeToProcessedTile,avalaibleTiles[i]))
                        //    newTile.distance++;
                    }
                    openList.push(newTile);
                    mapOfPreviousTiles.push({from: tileToProcess, to: newTile});
                }
            }
        }
    }
    return createPathFromPrevList(destination, mapOfPreviousTiles);
}

function isThereTurn(reouteToProcessedTile,tile){
    var xdiff = reouteToProcessedTile.to.pos.x - reouteToProcessedTile.from.pos.x;
    var ydiff = reouteToProcessedTile.to.pos.y - reouteToProcessedTile.from.pos.y;
    if( tile.pos.x == reouteToProcessedTile.to.pos.x + xdiff && tile.pos.y == reouteToProcessedTile.to.pos.y + ydiff)
        return false;
    else
        return true;
}

function createPathFromPrevList(destination, mapOfPreviousTiles){
    var reversePath = [destination];
    while(mapOfPreviousTiles.some(element => element.to.pos.x == reversePath[reversePath.length-1].pos.x && element.to.pos.y == reversePath[reversePath.length-1].pos.y)){
        var lastTileInPath = reversePath[reversePath.length-1];
        reversePath.push(mapOfPreviousTiles.find(element => element.to.pos.x == lastTileInPath.pos.x && element.to.pos.y == lastTileInPath.pos.y).from);
    }
    reversePath.reverse();

    reversePath.shift();
    
    return reversePath;
}

//console.log(clalculateHeuristic( {pos: {x: 3,y:2}},{pos: {x: 57,y:57}}));

function clalculateHeuristic(from, to){
    var manthattanHeur = calculateManhattanDistance(from, to);
    var findEdgeRoads = findEdgesWithHeuristics(from);
    var heuristic = manthattanHeur;
    
    for(var i = 0; i < findEdgeRoads.length; i++)
        if(findEdgeRoads[i].heuristic < manthattanHeur){
            var otherSideNeighbor  = findOtherSideNeighbor(findEdgeRoads[i]);
            var newHeur = findEdgeRoads[i].heuristic + 1 + calculateManhattanDistance(otherSideNeighbor, to);
            if(newHeur<heuristic)
                heuristic = newHeur;
        }
    return heuristic;
}

function calculateManhattanDistance(from, to){
    return Math.abs( from.pos.x - to.pos.x) + Math.abs(from.pos.y - to.pos.y);
}

function findOtherSideNeighbor(tile){
    if(tile.pos.x == 0)
        tile.pos.x = 59;
    else if(tile.pos.x == 59)
        tile.pos.x = 0;
    if(tile.pos.y == 0)
        tile.pos.y = 59;
    else if(tile.pos.y == 59)
        tile.pos.y = 0;
    return tile;
}

function findEdgesWithHeuristics(from){
    var edges = [];
    for(var i=0; i < 60;i++)
        for(var j=0; j < 60;j++)
            if( walkable[i][j]==0 && (i==0 || i==59||j==0||j==59) )
                edges.push({pos:{x: j,y:i}, heuristic: calculateManhattanDistance({pos:{x: j,y:i}},from) });
    return edges;
}


function avalaibleTilesFromProcessedTile(tileToProcess){
    var upCoordinate = tileToProcess.pos.y-1 > -1 ? tileToProcess.pos.y-1 : 59;
    var leftCoordinate = tileToProcess.pos.x-1 >  -1 ? tileToProcess.pos.x-1 : 59;
    var rightCoordinate = tileToProcess.pos.x+1 < 60 ? tileToProcess.pos.x+1 : 0;
    var downCoordinate = tileToProcess.pos.y+1 < 60 ? tileToProcess.pos.y+1 : 0;
    return getAccessableNeighbors(upCoordinate,rightCoordinate,downCoordinate,leftCoordinate,tileToProcess);
}

//console.log(chooseTheBestTileFromList([ { pos:{x:3,y:2},heuristic:3, distance:3 }, { pos:{x:3,y:4},heuristic:3, distance:3 }]));

function chooseTheBestTileFromList(openList){
    var tileToProcess = openList[0];
    for(var i = 1; i < openList.length; i++)
        if(openList[i].distance+openList[i].heuristic < tileToProcess.distance+tileToProcess.heuristic)
                tileToProcess = openList[i];
        else if(openList[i].distance+openList[i].heuristic == tileToProcess.distance+tileToProcess.heuristic && closerToEdge(openList[i],tileToProcess))
            tileToProcess = openList[i];
    return tileToProcess;
}

//console.log(closerToEdge({pos:{x:2,y:0}},{pos:{x:2,y:2}}))

function closerToEdge(openListElement, tileToProcess){
    var edgesFromOpenList =  findEdgesWithHeuristics(openListElement);
    var minFromOpen = edgesFromOpenList[0];

    for (let i = 1; i < edgesFromOpenList.length; ++i)
        if (edgesFromOpenList[i].heuristic < minFromOpen.heuristic)
            minFromOpen = edgesFromOpenList[i];

    var edgesFromTileToProcess = findEdgesWithHeuristics(tileToProcess);
    var minFromProc = edgesFromTileToProcess[0];

    for (let i = 1; i < edgesFromTileToProcess.length; ++i)
        if (edgesFromTileToProcess[i].heuristic < minFromProc.heuristic)
            minFromProc = edgesFromTileToProcess[i];

    if(minFromOpen.heuristic < minFromProc.heuristic)
        return true;
    else 
        return false;
}

function findPositionToGetIn(passenger,car,nofilter=false){

    //Ne legyen tulindexeles
    var upCoordinate = passenger.pos.y-1 > 0 ? passenger.pos.y-1 : passenger.pos.y+1;
    var leftCoordinate = passenger.pos.x-1 >  0 ? passenger.pos.x-1 :passenger.pos.x+1;
    var rightCoordinate = passenger.pos.x+1 < 60 ? passenger.pos.x+1 : passenger.pos.x-1;
    var downCoordinate = passenger.pos.y+1 < 60 ? passenger.pos.y+1 : passenger.pos.y-1;
    var accessableGetIns = getAccessableNeighbors(upCoordinate,rightCoordinate,downCoordinate,leftCoordinate,passenger,nofilter);

    if(nofilter){
        var newGetIns  = [];
        for(var i = 0; i < accessableGetIns.length; i++){
            if(findPositionToGetIn(accessableGetIns[i],car) != undefined)
                newGetIns.push(accessableGetIns[i]);
        }
        accessableGetIns = newGetIns;
    }

    var closestGetIn = accessableGetIns[0];


    for(var i = 0; i < accessableGetIns.length; i++){
        if( clalculateHeuristic(car, accessableGetIns[i]) < clalculateHeuristic(car, closestGetIn))
            closestGetIn = accessableGetIns[i];
    }
    
    return closestGetIn;
}

function getAccessableNeighbors(upCoordinate,rightCoordinate,downCoordinate,leftCoordinate,center,nofilter=false){
    var maybegetins = [{accessable: walkable[upCoordinate][center.pos.x ], pos: {x: center.pos.x, y:upCoordinate}},
        {accessable: walkable[downCoordinate][center.pos.x ], pos: {x: center.pos.x, y:downCoordinate}},
        {accessable: walkable[center.pos.y][leftCoordinate ], pos: {x: leftCoordinate, y:center.pos.y}},
        {accessable: walkable[center.pos.y][rightCoordinate ], pos: {x: rightCoordinate, y:center.pos.y}}];
    var legitGetins = maybegetins.filter(getIn => getIn.accessable == 0|| nofilter);
    return legitGetins;

}