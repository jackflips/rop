
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

function Node(currentLocation, angle, speed, special, connected) {
    this.currentLocation = currentLocation;
    this.angle = angle; //in degrees
    this.speed = speed; //pixels per second
    this.special = special;
    this.connected = false;

    this.printNode = function() {
        console.log("current location: " + this.currentLocation);
        console.log("angle: " + this.angle);
        console.log("speed " + this.speed);
        console.log("special: " + this.special);
    }
}


var context;
var nodes;
var counter;
var fps;
var numHops;
var numNodes;
var connectionDistance;
var possiblePaths;
var currentPath;
var circuitsBroken;
var connectionColors;
var canvasWidth;

function getRandInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function distanceBetweenTwoVectors(v1, v2) {
    var diff = [v2[0] - v1[0], v2[1] - v1[1]];
    return magnitude(diff[0], diff[1]);
}

function checkImmediateConnection() {
    for (i=1; i<numNodes; i++) {
        if (distanceBetweenTwoVectors(nodes[0].currentLocation, nodes[i].currentLocation) < connectionDistance) {
            nodes[i].connected = true;
        } else {
            nodes[i].connected = false;
        }
    }
}

function pathStillValid(path) {
    if (!path || path.length < 2) {
        return false;
    }
    for (i=0; i<path.length-1; i++) {
        if (distanceBetweenTwoVectors(nodes[path[i]].currentLocation, nodes[path[i+1]].currentLocation) > connectionDistance) {
            return false;
        }
    }
    return true;
}

function findPathHelper(currentNode, hop, hopsSoFar) {
    if (hop < 5) {
        if (hopsSoFar.length == 0) {
            hopsSoFar.push(0);
        }
        for (i=1; i<numNodes; i++) {
            if (currentNode != i && hopsSoFar.indexOf(i) == -1) {
                if (distanceBetweenTwoVectors(nodes[currentNode].currentLocation, nodes[i].currentLocation) < connectionDistance) {
                    var newPath = hopsSoFar.slice();
                    newPath.push(i);
                    findPathHelper(i, hop+1, newPath);
                }
            }
        }
    } else {
        possiblePaths.push(hopsSoFar);
    }
}

function pathBroken() {
    circuitsBroken++;
    $("#label").text(circuitsBroken + " circuits broken since you loaded this page.");
}

function findPath() {
    console.log("find path");
    possiblePaths = [];
    findPathHelper(0, 0, []);
    if (possiblePaths.length > 0) {
        return possiblePaths[getRandIntInRange(0, possiblePaths.length-1)];
    } else return [];
}

function magnitude(x1, x2) {
    return Math.sqrt(Math.pow(x1, 2) + Math.pow(x2, 2));
}

function selectNewTargetsForNodes() {
    if (nodes[0].speed > 8) {
        nodes[0].speed = 8;
    }
    for (node in nodes) {
        var theNode = nodes[node];
        if (!theNode.angle) {
            theNode.angle = getRandInRange(0, 2*Math.PI);
            theNode.speed = getRandInRange(5, 12);
        }
        theNode.angle = getRandInRange(theNode.angle-.35, theNode.angle+.35);
        theNode.speed = getRandInRange(theNode.speed-5, theNode.speed+5);
        if (theNode.speed > 16) {
            theNode.speed = 30;
        } else if (theNode.speed < -16) {
            theNode.speed = -30;
        }
        if (theNode.currentLocation[0] > (canvasWidth - 20) || theNode.currentLocation[0] < 20 || theNode.currentLocation[1] > 480 || theNode.currentLocation[1] < 20) {
            theNode.angle += 180;
        }
    }
}

function updateNodes() {
    for (node in nodes) {
        var theNode = nodes[node];
        var x = (theNode.speed / fps) * Math.sin(theNode.angle);
        var y = (theNode.speed / fps) * Math.cos(theNode.angle);
        theNode.currentLocation = [(theNode.currentLocation[0] + x).mod(canvasWidth), (theNode.currentLocation[1] + y).mod(500)];

    }
    if (!pathStillValid(currentPath)) {
        if (currentPath && currentPath.length > 2) {
            pathBroken();
            currentPath = findPath();
        } else {
            currentPath = findPath();
        }
    }
    for (node in nodes) {
        nodes[node].connected = false;
    }
    for (hop in currentPath) {
        nodes[currentPath[hop]].connected = true;
    }
}

function draw() {
    var canvas = document.getElementById('canvas');
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (i=0; i<nodes.length; i++) {
        if (i == 0) {
            context.fillStyle = "#FF0000";
        } else if (currentPath && currentPath.indexOf(i) != -1) {
            context.fillStyle = "#85d316"
        } else {
            context.fillStyle = "#0066CC";
        }
        context.beginPath();
        context.arc(nodes[i].currentLocation[0], nodes[i].currentLocation[1], 12, 0, Math.PI*2, false)
        if (nodes[i].special) {
            context.setLineDash([5, 8]);
            context.arc(nodes[i].currentLocation[0], nodes[i].currentLocation[1], 12, 0, Math.PI*2, false)
        }
        context.fill();
        context.closePath();
        context.beginPath();
        if (nodes[i].special) {
            context.strokeStyle = "#a3a3a3"
            context.setLineDash([5, 8]);
            context.arc(nodes[i].currentLocation[0], nodes[i].currentLocation[1], 100, 0, Math.PI*2, false);
            context.stroke();
        }
        if (currentPath && currentPath.indexOf(i) != -1 && i > 0) {
            context.fillStyle = "#000000"
            context.fillText(currentPath.indexOf(i), nodes[i].currentLocation[0]-3, nodes[i].currentLocation[1]+3);
        }
        context.closePath();
    }
}

$(function() {
    fps = 40;
    canvasWidth = $(window).width();
    nodes = [];
    speedLimit = 2.5;
    counter = 0;
    numHops = 6;
    connectionDistance = 100;
    numNodes = (canvasWidth * 500) / 2500;
    possiblePaths = [];
    circuitsBroken = 0;
    for (i=0; i<numNodes; i++) {
        if (i == 0) {
            nodes.push(new Node([getRandInRange(0, canvasWidth), getRandInRange(0, canvasWidth)], 0, 1, true));
        }
        nodes.push(new Node([getRandInRange(0, canvasWidth), getRandInRange(0, canvasWidth)], 0, 1, false));
    }
    var canvas = document.getElementById('canvas');
    canvas.width = canvasWidth;

    if (canvas.getContext) {
        context = canvas.getContext('2d');
    }
    setInterval(function() {
        if (counter % (fps/4) == 0) {
            selectNewTargetsForNodes();
            $("#speed").text("speed: " + nodes[0].speed);
        }
        updateNodes();
        draw();
        counter++;
    }, 1000/fps); //40 fps
});
