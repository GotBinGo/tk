
var net = require('net');
var PF = require('pathfinding');
var fs  = require("fs");

var map = fs.readFileSync('map.txt').toString().split("\n").map(item => item.trim());;

var client = new net.Socket();
token = "XCm41v5wXaM3TzNraLdRNIoHH159v1PXaQiE2ARfNDmF1RQuxmYzTCm3HJWGuGsuGckiDuw";

var height = map.length;
var width = map[0].length;
console.log(height)
console.log(width)

var walkable = map.map(x => x.split('').map(x => x == 'S' ? 0 : 1))

var grid = new PF.Grid(walkable);
var finder = new PF.AStarFinder();
var path = finder.findPath(2, 2, 8, 2, grid);
console.log(path)


client.connect(12323, '31.46.64.35', function() {
	client.write(JSON.stringify({token}));
});

client.on('data', function(data) {
    data = JSON.parse(data.toString());
    console.log(data);
    client.write(JSON.stringify({request_id: data.request_id, command: "NO_OP"}));
});

client.on('close', function() {
	console.log('Connection closed');
});




