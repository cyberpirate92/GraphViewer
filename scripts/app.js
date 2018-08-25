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

// misc control variables
var counter = 0;
var shapeProperties;
var DEFAULT_RADIUS = 30;
var TEXT_OFFSET_X = -6;
var TEXT_OFFSET_Y = 6;
var DEFAULT_FONT = "24px monospace";
var canvasCenter = {
    x: canvas.width/2,
    y: canvas.height/2
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
    let x = JSON.parse(textarea.value);
    
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

function initGraph(adjacencyMatrix) {
    
    console.log('Initializing Graph...');
    console.dir(adjacencyMatrix);

    adjMatrix = adjacencyMatrix;
    
    let offset = DEFAULT_RADIUS/2;
    let curX = offset + (2 * DEFAULT_RADIUS);
    let curY = offset + (2 * DEFAULT_RADIUS);
    
    for (let i=0; i<adjMatrix.length; i++) {
        nodes.push({
            x: curX,
            y: curY,
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

function clearCanvas() {
    counter = 0;
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