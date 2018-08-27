// sample adjacency matrix for initial load
var sample              = [[0,6,1,0,5,2],[6,0,5,2,5,1],[1,5,0,0,7,0],[0,2,0,0,5,9],[5,5,7,5,0,1],[2,1,0,9,1,0]];

// constant values
const DEFAULT_RADIUS      = 30;
const TEXT_OFFSET_X       = -6;
const TEXT_OFFSET_Y       = 6;
const DEFAULT_FONT        = "24px monospace";
const EDGE_WEIGHT_FONT    = "18px monospace";
const HIGHLIGHT_COLOR     = "#0FFFF0AA";
const DEFAULT_COLOR       = "#000000FF";

// DOM objects
var textarea            = document.querySelector("#matrixInput");
var goButton            = document.querySelector("#goBtn");
var randomizeButton     = document.querySelector("#randomizeBtn");
var exportButton        = document.querySelector("#exportBtn");
var importButton        = document.querySelector("#importBtn");

// misc control variables
var counter             = 0;
var selectedNode        = null;

// primary data store - contains information about the objects on the canvas
var nodes               = [];
var adjMatrix           = null;

// canvas related, will be initialized dynamically via initializeCanvas()
var canvas;
var ctx;

// debounce related
var rtime;
var timeout = false;
var delta = 200;

// Event listeners
window.addEventListener ('load', () => {
    initializeCanvas();
    textarea.value = indentString(JSON.stringify(sample));
    initGraph(sample);
});

window.addEventListener('resize', () => {
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        setTimeout(onResizeEnd, delta);
    }
});

// part of debounce logic to reduce number of canvas redraws
function onResizeEnd () {
    if (new Date() - rtime < delta) {
        setTimeout(onResizeEnd, delta);
    } else {
        timeout = false;
        initializeCanvas();
        initGraph(adjMatrix);
    }               
}

goButton.addEventListener('click', () => {
    loadMatrix(textarea);
});

randomizeButton.addEventListener('click', () => {
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
                temp[j][i] = temp[i][j] = getRandomNumber(1, 10);
                hasEdge = (edge > 0);
            }
            if (!hasEdge) {
                let index = -1;
                while (index <= 0 || index == i ) {
                    index = getRandomNumber(0, nodeCount);
                }
                temp[i][index] = temp[index][i] = getRandomNumber(1, 10);
            }
        }

        if (temp.length > 0) {
            textarea.value = indentString(JSON.stringify(temp));
            loadMatrix(textarea);
        }
    }
});

exportButton.addEventListener('click', () => {
    if (nodes.length <= 0) return;
    let defaultFileName = `GraphViewer_${getCurrentDateTimeString()}`;
    let filename = window.prompt("Filename", defaultFileName);
    if (!filename) {
        alert("File name invalid, try again");
        return;
    }
    exportGraph(filename);
});

importButton.addEventListener('click', () => {
    let fileInput = document.querySelector("#importFileInput");
    fileInput.click();
});

function removeAllChildNodes (container) {
    while(container.hasChildNodes()) {
        container.removeChild(container.lastChild);
    }
}

// initialize the canvas and related context
function initializeCanvas () {
    let canvasContainer = document.querySelector("#canvasContainer");
    removeAllChildNodes(canvasContainer);
    canvas = document.createElement("canvas");
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
    canvasContainer.appendChild(canvas);
    ctx = canvas.getContext("2d");
    registerCanvasEventListeners();
}

// since canvas is created dynamically, wrapper function is required
function registerCanvasEventListeners () {
    canvas.addEventListener ('mousedown', (mouseEvent) => {
        console.info('MouseDown');
        console.log(mouseEvent);
        selectedNode = getNodeAtPoint(mouseEvent.clientX, mouseEvent.clientY);
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
        drawGraph();
    });    
}

// returns index of the node that contains the point or null
function getNodeAtPoint (x, y) {
    let R = DEFAULT_RADIUS;
    for (let i=0; i<nodes.length; i++) {
        if (( x >= nodes[i].x-R && x <= nodes[i].x+R ) && ( y >= nodes[i].y-R && y <= nodes[i].y+R ))
            return i;
    }
    return null;
}

// initializes the given adjacency matrix if it's a valid input
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

// initializes the graph, expects a valid adjacency matrix
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
    let canvasCenter = {
        x: parseInt(canvas.width/2),
        y: parseInt(canvas.height/2)
    };
    
    for (let i=0; i<adjMatrix.length; i++) {
        nodes.push({
            nodeId: i,
            x: getX((angleDivident * (i+1)), 120, canvasCenter.x),
            y: getY((angleDivident * (i+1)), 120, canvasCenter.y),
            edges: adjMatrix[i],
            isHighlighted: false,
        });
    }

    drawGraph();
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

// reset the canvas
function clearCanvas () {
    counter = 0;
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
}

// draws the graph (nodes, edges, weights etc..)
function drawGraph () {
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

// draw a colored edge from node1 to node2
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

function drawNodeText (posx, posy, text, color) {
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

// draws a circle with the label text as the current value of counter 
function drawNumberedCircle (posx, posy, isHighlighted) {
    drawCircleWithRadius(posx, posy, DEFAULT_RADIUS, isHighlighted);
    drawNodeText(posx, posy, String.fromCharCode(65 + counter++));
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

// returns a random number in the range (numStart, numEnd-1)
function getRandomNumber (numStart, numEnd) {
    return parseInt((parseInt(Math.random() * 10000000) + numStart) % numEnd);
}

// returns the current datetime string in the format YYYY-MM-DDTHH-mm-SS
function getCurrentDateTimeString () {
    let x = new Date();
    return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}T${x.getHours()}-${x.getMinutes()}-${x.getSeconds()}`;
}

// triggers a browser download with data as the serialized JSON of the given object
function downloadObjectAsJson (exportObj, exportName){
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// exports the currently loaded graph with the provided filename
function exportGraph (filename) {
    downloadObjectAsJson(nodes.map(function(node) {
        return {
            nodeId: node.nodeId,
            x: node.x,
            y: node.y,
            edges: node.edges
        };
    }), filename);
}

// validate & import a graph from the uploaded file
function importGraph (fileList) {
    if (fileList.length <= 0) 
        return;
    
    let fileHandle = fileList[0];
    let fileReader = new FileReader();
    fileReader.onloadend = function(event) {
        let fileContent = fileReader.result;
        try {
            let importedNodes = JSON.parse(fileContent);
            importedNodes.forEach(node => node.isHighlighted = false);
            let matrix = generateAdjacencyMatrix(importedNodes);
            if (matrix) {
                adjMatrix = matrix;
                nodes = importedNodes;
                textarea.value = indentString(JSON.stringify(adjMatrix));
                drawGraph();
                console.log('Import successful');
            }
            else throw "Import failed";
        }
        catch(e) {
            console.log(e);
            alert('Import failed: Invalid file');
        }
    };
    fileReader.readAsText(fileHandle);
}

// returns an indented string containing proper spaces, works only for JSON serialzed arrays
// for example: [[1, 2, 3,  4], [5, 6, 7, 8]] 
// will be indented as [\n[1,2,3,4],\n[5,6,7,8]\n]
function indentString (stringifiedArray) {
    if (!stringifiedArray || typeof stringifiedArray !== "string") 
        return stringifiedArray;
    
    return stringifiedArray
        .replace(/\s/g,'')          /* remove all spaces */
        .replace(/,\[/g, ',\n[')    /* replace all ,[ occurences with ,\n[ */
        .replace(/\[\[/g, '[\n[')    /* replace all [[ occurences with [\n[ */
        .replace(/\]\]/g, ']\n]');   /* replace all ]] occurences with ]\n] */
}

// returns the adjacency matrix representation of the provided node data array
function generateAdjacencyMatrix (nodes) {
    if (!nodes || !(nodes instanceof Array) || nodes.length <= 0) 
        return null;
   
    let temp = [];
    // pushing empty arrays
    for (let i=0; i<nodes.length; i++) {
        temp.push(null);
    }
    // pushing data to indices
    for (let i=0; i<nodes.length; i++) {
        temp[nodes[i].nodeId] = nodes[i].edges;
    }
    return temp;
}