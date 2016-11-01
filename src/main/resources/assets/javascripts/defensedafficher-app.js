// Copyright 2010 William Malone (www.williammalone.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*jslint browser: true */
/*global G_vmlCanvasManager */

var app = (function () {

	"use strict";

	var canvas,
		context,
		canvasWidth = window.innerWidth,
		canvasHeight = window.innerHeight,
		image = new Image(),
		paint = false,
		curColor = "#cb3594",
		curTool = "marker",
		curSize = "normal",
		drawingAreaX = 0,
		drawingAreaY = 0,
		drawingAreaWidth = window.innerWidth,
		drawingAreaHeight = window.innerHeight,
		wall,
		drawing,
		wallId,
		rx,
        ry,
        drawImageWidth,
        drawImageHeight,
        tx,
        ty,
        rendering = {
            background: false,
            drawings: []
        },
        socket,

		// Execute request and receive response as JSON
		getJSON = function(url) {
          return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('get', url, true);
            xhr.responseType = 'json';
            xhr.onload = function() {
              var status = xhr.status;
              if (status == 200) {
                resolve(xhr.response);
              } else {
                reject(status);
              }
            };
            xhr.send();
          });
        },

        postJSON = function(url, data) {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('post', url, true);
                xhr.responseType = 'json';
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onload = function() {
                    var status = xhr.status;
                    if (status == 200) {
                        resolve(xhr.response);
                    } else {
                        reject(status);
                    }
                };
                xhr.send(JSON.stringify(data));
            });
        },

		// Clears the canvas.
		clearCanvas = function () {
			context.clearRect(0, 0, canvasWidth, canvasHeight);
		},

		updateTransformations = function() {
		    drawingAreaWidth = window.innerWidth;
            drawingAreaHeight = window.innerHeight;
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.setAttribute('width', canvasWidth);
            canvas.setAttribute('height', canvasHeight);
		    rx = drawingAreaWidth / image.width;
            ry = drawingAreaHeight / image.height;
            if (image.height * rx < drawingAreaHeight) {
                drawImageWidth = image.width * ry;
                drawImageHeight = drawingAreaHeight;
                rx = drawImageWidth / image.width;
                tx = - (image.width * rx - drawingAreaWidth) / 2;
                ty = - (image.height * ry - drawingAreaHeight) / 2;
            } else {
                drawImageWidth = drawingAreaWidth;
                drawImageHeight = image.height * rx;
                ry = drawImageHeight / image.height
                tx = - (image.width * rx - drawingAreaWidth) / 2;
                ty = - (image.height * ry - drawingAreaHeight) / 2;
            }
		},

		// Render the canvas.
		render = function () {

			var locX,
				locY,
				radius,
				i,
				j,
				selected;

            if (!rendering.background) {
                context.globalAlpha = 1;
			    clearCanvas();
			    // Draw the background image
                context.drawImage(image, drawingAreaX + tx, drawingAreaY + ty, drawImageWidth, drawImageHeight);
			    rendering.background = true;
			}

			if (wall == null) {
                return;
            }
			// Keep the drawing in the drawing area
			context.save();
			context.beginPath();
			context.rect(drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
			context.clip();

			// For each wall drawing drawn
			for (i = 0; i < wall.drawings.length; i += 1) {
			    var d = wall.drawings[i];
			    var r = rendering.drawings[i];
			    if (!r) {
			        r = [];
			        rendering.drawings.push(r);
			    }
                for (j = 0; j < d.x.length; j += 1)
                {
				    if (!r || !r[j]) {
                        // Set the drawing radius
                        switch (d.size[j]) {
                            case "small":
                                radius = 2;
                                break;
                            case "normal":
                                radius = 5;
                                break;
                            case "large":
                                radius = 10;
                                break;
                            case "huge":
                                radius = 20;
                                break;
                            default:
                                break;
                        }
                        // Set the drawing path
                        context.beginPath();
                        // If dragging then draw a line between the two points
                        if (d.drag[j] && j) {
                            context.moveTo(d.x[j - 1] * rx + tx, d.y[j - 1] * ry + ty);
                        } else {
                            // The x position is moved over one pixel so a circle even if not dragging
                            context.moveTo(d.x[j] * rx - 1 + tx, d.y[j] * ry + ty);
                        }
                        context.lineTo(d.x[j] * rx + tx, d.y[j] * ry + ty);
                        context.strokeStyle = d.color[j];
                        context.lineCap = "round";
                        context.lineJoin = "round";
                        context.lineWidth = radius;
                        context.globalAlpha = 0.25;
                        context.stroke();
                        r.push(true);
                    }
				}
			}
			context.closePath();
			context.restore();
		},

		// Adds a point to the drawing array.
		// @param x
		// @param y
		// @param dragging
		addClick = function (x, y, dragging) {
		    var imageX = (x - tx) / rx;
		    var imageY = (y - ty) / ry;
			drawing.x.push(imageX);
            drawing.y.push(imageY);
            drawing.tool.push(curTool);
            drawing.color.push(curColor);
            drawing.size.push(curSize);
            drawing.drag.push(dragging);
            send({
                x: imageX,
                y: imageY,
                tool: curTool,
                color: curColor,
                size: curSize,
                drag: dragging,
                name: drawing.name
            });
		},

		// Add mouse and touch event listeners to the canvas
		createUserEvents = function () {

			var press = function (e) {
				// Mouse down location
				var mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft,
mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;
				paint = true;
				addClick(mouseX, mouseY, false);
				render();
			},

			drag = function (e) {
				
				var mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft,
					mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;
				
				if (paint) {
					addClick(mouseX, mouseY, true);
					render();
				}
				// Prevent the whole page from dragging if on mobile
				e.preventDefault();
			},

			release = function () {
				paint = false;
				render();
			},

			cancel = function () {
				paint = false;
			};

			// Add mouse event listeners to canvas element
			canvas.addEventListener("mousedown", press, false);
			canvas.addEventListener("mousemove", drag, false);
			canvas.addEventListener("mouseup", release);
			canvas.addEventListener("mouseout", cancel, false);

			// Add touch event listeners to canvas element
			canvas.addEventListener("touchstart", press, false);
			canvas.addEventListener("touchmove", drag, false);
			canvas.addEventListener("touchend", release, false);
			canvas.addEventListener("touchcancel", cancel, false);

			// Add window resize event handler
			window.addEventListener("resize", resize, false);
		},

		redrawAll = function() {
		    clearRendering();
            updateTransformations();
            render();
		},

		resize = function () {
		    redrawAll();
		},

		clearRendering = function() {
		    rendering.background = false;
		    rendering.drawings = [];
		},

		// Calls the render function after all necessary resources are loaded.
		resourceLoaded = function () {
		    redrawAll();
		},

	    onopen = function(event) {
            console.log("Connected to the Draw WebSocket")
        },

        onmessage = function(event) {
            console.log("Received data : " + event.data);
            var point = JSON.parse(event.data);
            var i;
            var d;
            if (point.name == drawing.name) {
                return;
            }
            for (i = 0; i < wall.drawings.length; i += 1) {
                if (wall.drawings[i].name == point.name) {
                    d = wall.drawings[i];
                }
            }
            if (!d) {
                d = new Object();
                d.x =  [];
                d.y = [];
                d.color = [];
                d.size = [];
                d.drag = [];
                d.tool = [];
                d.name = point.name;
                wall.drawings.push(d);
            }
            d.x.push(point.x);
            d.y.push(point.y);
            d.tool.push(point.tool);
            d.size.push(point.size);
            d.drag.push(point.drag);
            d.color.push(point.color);
            render();
        },

        onclose = function(event) {
            console.log("Disconnected from the Draw WebSocket")
        },

		createSocket = function() {
		    if (socket != null) {
		        socket.close();
		    }
		    if (!window.WebSocket) {
                window.WebSocket = window.MozWebSocket;
            }
            if (window.WebSocket) {
                // Compute the web socket url.
                // window.location.host includes the port
                var url = "ws://" + window.location.host + '/draw/' + wallId;
                socket = new WebSocket(url);
                socket.onopen = onopen;
                socket.onmessage = onmessage;
                socket.onclose = onclose;
            } else {
                alert("Your browser does not support Web Socket.");
            }
		},

		send = function(point) {
        	socket.send(JSON.stringify(point));
        },

		// Creates a canvas element, loads images, adds events, and draws the canvas for the first time.
		init = function () {
			// Create the canvas (Neccessary for IE because it doesn't know what a canvas element is)
			canvas = document.createElement('canvas');
			canvas.setAttribute('width', canvasWidth);
			canvas.setAttribute('height', canvasHeight);
			canvas.setAttribute('id', 'canvas');
			document.getElementById('canvasDiv').appendChild(canvas);
			if (typeof G_vmlCanvasManager !== "undefined") {
				canvas = G_vmlCanvasManager.initElement(canvas);
			}
			context = canvas.getContext("2d"); // Grab the 2d canvas context
			// Note: The above code is a workaround for IE 8 and lower. Otherwise we could have used:
			//     context = document.getElementById('canvas').getContext("2d");

			// Load images
			image.onload = resourceLoaded;
			wallId = 1;
			loadImage();
			createUserEvents();
			resize();
		},

		loadImage = function() {
		    image.src = "assets/images/defensedafficher" + wallId + ".jpg";
        	getJSON('http://' + window.location.hostname + ':' + window.location.port + '/api/walls/' + wallId)
        	    .then(function(data) {
                    wall = data;
                    drawing = new Object();
                    drawing.x =  [];
                    drawing.y = [];
                    drawing.color = [];
                    drawing.size = [];
                    drawing.drag = [];
                    drawing.tool = [];
                    drawing.name = Date.now();
                    createSocket();
                    wall.drawings.push(drawing);
                    redrawAll();
                }, function(status) { //error detection....
                    alert('Unable to load wall data.');
                });
		},

		previous = function() {
		    if (wallId == 1) {
		        wallId = 10;
		    } else {
		        wallId = wallId - 1;
		    }
            loadImage();
		},

		next = function() {
		    if (wallId == 10) {
		        wallId = 1;
		    } else {
		        wallId = wallId + 1;
		    }
		    loadImage();
		},

		setColor = function(color) {
            curColor = color;
		},

		setSize = function(size) {
		    curSize = size;
		};

    var obj = {
        init: init,
        previous: previous,
        next: next,
        setColor: setColor,
        setSize: setSize
    };
	return obj;
}());
