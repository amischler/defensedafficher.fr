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
		outlineImage = new Image(),
		clickX = [],
		clickY = [],
		clickColor = [],
		clickTool = [],
		clickSize = [],
		clickDrag = [],
		paint = false,
		curColor = "#cb3594",
		curTool = "marker",
		curSize = "normal",
		drawingAreaX = 0,
		drawingAreaY = 0,
		drawingAreaWidth = window.innerWidth,
		drawingAreaHeight = window.innerHeight,
		wall,
		wallId,
		drawing,

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

		// Redraws the canvas.
		redraw = function () {

			var locX,
				locY,
				radius,
				i,
				selected;

			clearCanvas();

			// Draw the outline image
            context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);

			// Keep the drawing in the drawing area
			context.save();
			context.beginPath();
			context.rect(drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
			context.clip();

			// For each point drawn
			for (i = 0; i < clickX.length; i += 1) {

				// Set the drawing radius
				switch (clickSize[i]) {
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
				if (clickDrag[i] && i) {
					context.moveTo(clickX[i - 1], clickY[i - 1]);
				} else {
					// The x position is moved over one pixel so a circle even if not dragging
					context.moveTo(clickX[i] - 1, clickY[i]);
				}
				context.lineTo(clickX[i], clickY[i]);
				
				context.strokeStyle = clickColor[i];
				context.lineCap = "round";
				context.lineJoin = "round";
				context.lineWidth = radius;
				context.globalAlpha = 0.25;
				context.stroke();
			}
			context.closePath();
			//context.globalCompositeOperation = "source-over";// To erase instead of draw over with white
			context.restore();

			context.globalAlpha = 1; // No IE support

		},

		// Adds a point to the drawing array.
		// @param x
		// @param y
		// @param dragging
		addClick = function (x, y, dragging) {

			clickX.push(x);
			clickY.push(y);
			clickTool.push(curTool);
			clickColor.push(curColor);
			clickSize.push(curSize);
			clickDrag.push(dragging);
			drawing.x.push(x);
            drawing.y.push(y);
            drawing.tool.push(curTool);
            drawing.color.push(curColor);
            drawing.size.push(curSize);
            drawing.drag.push(dragging);
		},

		// Add mouse and touch event listeners to the canvas
		createUserEvents = function () {

			var press = function (e) {
				// Mouse down location
				var sizeHotspotStartX,
					mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft,
mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;
				paint = true;
				addClick(mouseX, mouseY, false);
				redraw();
			},

			drag = function (e) {
				
				var mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft,
					mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;
				
				if (paint) {
					addClick(mouseX, mouseY, true);
					redraw();
				}
				// Prevent the whole page from dragging if on mobile
				e.preventDefault();
			},

			release = function () {
				paint = false;
				postJSON('http://' + window.location.hostname + ':' + window.location.port + '/api/walls/' + wall.name, drawing).then(function(data) {
                                wall = data;
                                }, function(status) { //error detection....
                                 alert('Unable to post drawing data.');
                            });
				redraw();
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
		},

		// Calls the redraw function after all neccessary resources are loaded.
		resourceLoaded = function () {
		    redraw();
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
			outlineImage.onload = resourceLoaded;
			wallId = 1;
			loadImage();
			createUserEvents();
		},

		loadImage = function() {
		    outlineImage.src = "assets/images/defensedafficher" + wallId + ".jpg";
        			getJSON('http://' + window.location.hostname + ':' + window.location.port + '/api/walls/' + wallId).then(function(data) {
                        wall = data;
                        clickX = [];
                        clickY = [];
                        clickColor = [];
                        clickTool = [];
                        clickSize = [];
                        clickDrag = [];
                        var i;
                        for (i = 0; i < data.drawings.length; i += 1) {
                            clickX = clickX.concat(data.drawings[i].x);
                            clickY = clickY.concat(data.drawings[i].y);
                            clickColor = clickColor.concat(data.drawings[i].color);
                            clickSize = clickSize.concat(data.drawings[i].size);
                            clickDrag = clickDrag.concat(data.drawings[i].drag);
                            clickTool = clickTool.concat(data.drawings[i].tool);
                        };
                        drawing = new Object();
                        drawing.x =  [];
                        drawing.y = [];
                        drawing.color = [];
                        drawing.size = [];
                        drawing.drag = [];
                        drawing.tool = [];
                        drawing.name = Date.now();
                        wall.drawings.push(drawing);
                        redraw();
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
