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
var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var textarea = document.querySelector("#matrixInput");
var goButton = document.querySelector("#goBtn");
var randomizeButton = document.querySelector("#randomizeBtn");

// misc control variables
var counter = 0;
var shapeProperties;
var DEFAULT_RADIUS = 30;
var TEXT_OFFSET_X = -6;
var TEXT_OFFSET_Y = 6;
var DEFAULT_FONT = "24px monospace";
var canvasCenter = {
    x: parseInt(canvas.width/2),
    y: parseInt(canvas.height/2)
};
var selectedNode = null;

// primary data store - contains information about the objects on the canvas
var nodes = [];
var adjMatrix = null;

// Event listeners
window.addEventListener('load', () => {
    textarea.value = JSON.stringify(graphC);
    initGraph(graphC);
});

goButton.addEventListener('click', () => {
    loadMatrix(textarea);
});

randomizeButton.addEventListener('click', () => {
    let nodeCount = parseInt(prompt("How many nodes (2-26)?", '6'));
    if (nodeCount <= 1) {
        alert("Need atleast 2 nodes"); 
        return;
    }
    else if (nodeCount > 26) {
        alert("Cannot exceed 26 nodes");
        return;
    }
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
                temp[j][i] = temp[i][j] = edge;
                hasEdge = (edge > 0);
            }
            if (!hasEdge) {
                let index = -1;
                while (index <= 0 || index == i ) {
                    index = parseInt(Math.random() * 10000) % nodeCount;
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

canvas.addEventListener('mousedown', (mouseEvent) => {

    console.info('MouseDown');
    console.log(mouseEvent);
    
    for (let i=0; i<nodes.length; i++) {
        let node = nodes[i];

        let R = DEFAULT_RADIUS;
        let x = mouseEvent.clientX;
        let y = mouseEvent.clientY;
        
        if (( x >= node.x-R && x <= node.x+R ) && ( y >= node.y-R && y <= node.y+R )) {
            selectedNode = i;
            break;
        }
    }
    console.info(`Selected Node Index: ${selectedNode}`);
});

canvas.addEventListener('mouseup', (mouseEvent) => {

    console.info('MouseUp');
    console.log(mouseEvent);

    selectedNode = null;
    console.info(`Selected Node Index: ${selectedNode}`);
});

canvas.addEventListener('mousemove', (mouseEvent) => {

    if (selectedNode || selectedNode === 0) {
        console.info('MouseMove');
        console.log(mouseEvent);
        nodes[selectedNode].x = mouseEvent.clientX;
        nodes[selectedNode].y = mouseEvent.clientY;
        redraw();
    }
});

function loadMatrix(input) {
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

function initGraph(adjacencyMatrix) {
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
function getX(angle, radius, cx) {
    return cx + (radius * Math.cos(toRadians(angle)));
}

// get the y coordinate on the circle circumference 
// provided the origin, radius and angle 
function getY(angle, radius, cy) {
    return cy + (radius * Math.sin(toRadians(angle)));
}

function clearCanvas() {
    counter = 0;
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
}

function redraw() {
    clearCanvas();
    for (let i=0; i<adjMatrix.length; i++) {
        for (let j=i+1; j<adjMatrix[i].length; j++) {
            if (adjMatrix[i][j] > 0) {
                drawEdge(nodes[i], nodes[j]);
            }
        }
    }
    for (let i=0; i<nodes.length; i++) {
        drawNumberedCircle(nodes[i].x, nodes[i].y);
    }
}

function drawEdge(node1, node2) {
    console.info(`Drawing edge from node ${JSON.stringify(node1)} to node ${JSON.stringify(node2)}`);
    let temp = ctx.lineWidth;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(node1.x, node1.y);
    ctx.lineTo(node2.x, node2.y);
    ctx.stroke();
    ctx.lineWidth = temp;
}

function drawText(posx, posy, text) {
    // Adding offsets for proper text centering
    posx = parseInt(posx + TEXT_OFFSET_X);
    posy = parseInt(posy + TEXT_OFFSET_Y);

    console.info(`Drawing text '${text}' at position (${posx}, ${posy})`);
    let temp = ctx.fillStyle;
    ctx.fillStyle = "#FFF";
    ctx.font = DEFAULT_FONT;
    ctx.fillText(text, posx, posy);
    ctx.fillStyle = temp;
}

function drawCircleWithRadius(posx, posy, radius) {
    console.log(`Circle drawn at pos (${posx}, ${posy}) with radius ${radius}`);
    ctx.beginPath();
    ctx.arc(posx, posy, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
}

function drawNumberedCircle(posx, posy) {
    drawCircleWithRadius(posx, posy, DEFAULT_RADIUS);
    drawText(posx, posy, String.fromCharCode(65 + counter++));
}

// JS Math trig functions accept only radians
function toRadians (angle) {
    return angle * (Math.PI / 180);
}