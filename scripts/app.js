// some matrices for testing
var graphA = [
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
];

var graphB = [
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 0]
];

var graphC = [
    [0, 3, 7, 6, 0],
    [3, 0, 0, 1, 2],
    [7, 0, 0, 0, 9],
    [6, 1, 0, 0 ,0],
    [0, 2, 9, 0, 0]
];

// DOM objects
var canvas              = document.querySelector('#canvas');
var ctx                 = canvas.getContext('2d');
var textarea            = document.querySelector("#matrixInput");
var goButton            = document.querySelector("#goBtn");
var randomizeButton     = document.querySelector("#randomizeBtn");

// misc control variables
var counter             = 0;
var DEFAULT_RADIUS      = 30;
var TEXT_OFFSET_X       = -6;
var TEXT_OFFSET_Y       = 6;
var DEFAULT_FONT        = "24px monospace";
var EDGE_WEIGHT_FONT    = "18px monospace";
var HIGHLIGHT_COLOR     = "#00FF00AA";
var DEFAULT_COLOR       = "#000000FF";
var selectedNode        = null;
var canvasCenter        = {
    x: parseInt(canvas.width/2),
    y: parseInt(canvas.height/2)
};

// primary data store - contains information about the objects on the canvas
var nodes               = [];
var adjMatrix           = null;

// Event listeners
window.addEventListener ('load', () => {
    textarea.value = JSON.stringify(graphC);
    initGraph(graphC);
});

goButton.addEventListener ('click', () => {
    loadMatrix(textarea);
});

randomizeButton.addEventListener ('click', () => {
    let nodeCount = parseInt(prompt("How many nodes (3-26)?", '6'));
    if (nodeCount <= 2)
        alert("Need atleast 3 nodes"); 
    else if (nodeCount > 26)
        alert("Cannot exceed 26 nodes");
    else {
        let temp = [];

        // creating a NxN matrix filled with 0s where N = nodeCount
        for (let i=0; i<nodeCount; i++) {
            temp.push([]);
            for (let j=0; j<nodeCount; j++) {
                temp[i].push(0);
            }
        }

        // populating matrix with random edges
        for (let i=0; i<nodeCount; i++) {
            let hasEdge = false;
            for (let j=i+1; j<nodeCount; j++) {
                let edge = parseInt(Math.random() * 10000) % 2 === 0 ? 1 : 0;
                temp[j][i] = temp[i][j] = getRandomNumber(0, 10);
                hasEdge = (edge > 0);
            }
            if (!hasEdge) {
                let index = -1;
                while (index <= 0 || index == i ) {
                    index = getRandomNumber(0, nodeCount);
                }
                temp[i][index] = temp[index][i] = 1;
            }
        }

        if (temp.length > 0) {
            textarea.value = JSON.stringify(temp);
            loadMatrix(textarea);
        }
    }
});

canvas.addEventListener ('mousedown', (mouseEvent) => {
    console.info('MouseDown');
    console.log(mouseEvent);
    selectedNode = getNodeAtPoint(mouseEvent.clientX, mouseEvent.clientY);
    console.info(`Selected Node Index: ${selectedNode}`);
});

canvas.addEventListener ('mouseup', (mouseEvent) => {
    console.info('MouseUp');
    console.log(mouseEvent);
    selectedNode = null;
    console.info(`Selected Node Index: ${selectedNode}`);
});

canvas.addEventListener ('mousemove', (mouseEvent) => {
    if (selectedNode || selectedNode === 0) {
        console.info('MouseMove');
        console.log(mouseEvent);
        nodes[selectedNode].x = mouseEvent.clientX;
        nodes[selectedNode].y = mouseEvent.clientY;
    }
    else {
        let index = getNodeAtPoint(mouseEvent.clientX, mouseEvent.clientY);
        if (index || index === 0 ) {
            nodes[index].isHighlighted = true;
            for (let i=0; i<adjMatrix[index].length; i++) {
                if (adjMatrix[index][i] > 0) {
                    nodes[i].isHighlighted = true;
                }
            }
        }
        else
            nodes.forEach(node => node.isHighlighted = false);
    }
    redraw();
});

// returns index of the node that contains the point or null
function getNodeAtPoint (x, y) {
    let R = DEFAULT_RADIUS;
    for (let i=0; i<nodes.length; i++) {
        if (( x >= nodes[i].x-R && x <= nodes[i].x+R ) && ( y >= nodes[i].y-R && y <= nodes[i].y+R ))
            return i;
    }
    return null;
}

function loadMatrix (input) {
    let x = JSON.parse(input.value);
    
    if (!(x instanceof Array)) {
        alert("Invalid adjacency matrix");
        return;
    }

    for (let i=0; i<x.length; i++) {
        if (!(x[i] instanceof Array)) {
            alert("Invalid adjacency matrix");
            return;
        }
        if (x[i].length != x.length) {
            alert("Not a squre matrix: Adjacency Matrix must be a square matrix");
            return;
        }
    }

    initGraph(x);
}

function initGraph (adjacencyMatrix) {
    // clearing node data 
    while(nodes.length > 0) {
        nodes.pop();
    }
    console.log('Initializing Graph...');
    console.dir(adjacencyMatrix);

    adjMatrix = adjacencyMatrix;

    let nodeCount = adjMatrix.length;
    let angleDivident = 360 / nodeCount;

    let offset = DEFAULT_RADIUS/2;
    let curX = offset + (2 * DEFAULT_RADIUS);
    let curY = offset + (2 * DEFAULT_RADIUS);
    
    for (let i=0; i<adjMatrix.length; i++) {
        nodes.push({
            x: getX((angleDivident * (i+1)), 120, canvasCenter.x),
            y: getY((angleDivident * (i+1)), 120, canvasCenter.y),
            isHighlighted: false
        });
        if ( curX + (2 * DEFAULT_RADIUS) + offset > canvas.width) {
            curX = offset + (2 * DEFAULT_RADIUS);
            curY = DEFAULT_RADIUS * 2 + offset;
        }
        else {
            curX += (2 * DEFAULT_RADIUS) + offset;
        }
    }

    redraw();
    console.log('Node data');
    console.dir(nodes);
}

// get the x coordinate on the circle circumference 
// provided the origin, radius and angle 
function getX (angle, radius, cx) {
    return cx + (radius * Math.cos(toRadians(angle)));
}

// get the y coordinate on the circle circumference 
// provided the origin, radius and angle 
function getY (angle, radius, cy) {
    return cy + (radius * Math.sin(toRadians(angle)));
}

function clearCanvas () {
    counter = 0;
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
}

function redraw () {
    clearCanvas();
    for (let i=0; i<adjMatrix.length; i++) {
        for (let j=i+1; j<adjMatrix[i].length; j++) {
            if (adjMatrix[i][j] > 0) {
                drawEdge(nodes[i], nodes[j], (nodes[i].isHighlighted === nodes[j].isHighlighted && nodes[i].isHighlighted === true) ? HIGHLIGHT_COLOR : DEFAULT_COLOR);
                drawEdgeWeightText(((nodes[i].x + nodes[j].x)/2), ((nodes[i].y + nodes[j].y)/2), adjMatrix[i][j], 'red');
            }
        }
    }
    for (let i=0; i<nodes.length; i++) {
        drawNumberedCircle(nodes[i].x, nodes[i].y, nodes[i].isHighlighted);
    }
}

function drawEdge (node1, node2, color) {
    console.info(`Drawing edge from node ${JSON.stringify(node1)} to node ${JSON.stringify(node2)}`);
    let temp = ctx.lineWidth;
    let tempColor = ctx.strokeStyle;
    ctx.lineWidth = 2;
    ctx.strokeStyle = color || DEFAULT_COLOR;
    ctx.beginPath();
    ctx.moveTo(node1.x, node1.y);
    ctx.lineTo(node2.x, node2.y);
    ctx.stroke();
    ctx.lineWidth = temp;
    ctx.strokeStyle = tempColor;
}

function drawText (posx, posy, text, color) {
    // Adding offsets for proper text centering
    posx = parseInt(posx + TEXT_OFFSET_X);
    posy = parseInt(posy + TEXT_OFFSET_Y);

    console.info(`Drawing text '${text}' at position (${posx}, ${posy})`);
    let temp = ctx.fillStyle;
    ctx.fillStyle = color ? color : "#FFF";
    ctx.font = DEFAULT_FONT;
    ctx.fillText(text, posx, posy);
    ctx.fillStyle = temp;
}

function drawEdgeWeightText (posx, posy, weight, color) {
    posx = parseInt(posx );
    posy = parseInt(posy );

    let temp = ctx.fillStyle;
    ctx.fillStyle = color ? color : 'blue';
    ctx.font = EDGE_WEIGHT_FONT;
    ctx.fillText(`${weight}`, posx, posy);
    ctx.fillStyle = temp;
}

function drawCircleWithRadius (posx, posy, radius, isHighlighted) {
    console.log(`Circle drawn at pos (${posx}, ${posy}) with radius ${radius}`);
    let temp = ctx.fillStyle;
    ctx.fillStyle = isHighlighted ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
    ctx.beginPath();
    ctx.arc(posx, posy, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = temp;
}

function drawNumberedCircle (posx, posy, isHighlighted) {
    drawCircleWithRadius(posx, posy, DEFAULT_RADIUS, isHighlighted);
    drawText(posx, posy, String.fromCharCode(65 + counter++));
}

// JS Math trig functions accept only radians
function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function toDegrees (radians) {
    return radians * (180 / Math.PI);
}

// calculate the angle between 2 points relative to the horizontal axis in radians
function getAngleBetweenPoints (p1, p2) {
    let deltaX = p1.x - p2.x;
    let deltaY = p1.y - p2.y;
    return Math.atan2(p2.x-p2.x, p1.y-p2.y);
}

// returns a random number in the inclusive range of (numStart, numEnd)
function getRandomNumber (numStart, numEnd) {
    return parseInt((parseInt(Math.random() * 10000000) + numStart) % numEnd);
}