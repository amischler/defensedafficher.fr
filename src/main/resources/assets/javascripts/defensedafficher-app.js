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

var drawingApp = (function () {

	"use strict";

	var canvas,
		context,
		canvasWidth = window.innerWidth,
		canvasHeight = window.innerHeight,
		colorPurple = "#cb3594",
		colorGreen = "#659b41",
		colorYellow = "#ffcf33",
		colorBrown = "#986928",
		outlineImage = new Image(),
		crayonImage = new Image(),
		markerImage = new Image(),
		eraserImage = new Image(),
		clickX = [],
		clickY = [],
		clickColor = [],
		clickTool = [],
		clickSize = [],
		clickDrag = [],
		paint = false,
		curColor = colorPurple,
		curTool = "marker",
		curSize = "normal",
		drawingAreaX = 0,
		drawingAreaY = 0,
		drawingAreaWidth = window.innerWidth,
		drawingAreaHeight = window.innerHeight,
		totalLoadResources = 1,
		curLoadResNum = 0,
		sizeHotspotWidthObject = {
			huge: 39,
			large: 25,
			normal: 18,
			small: 16
		},
		wall,
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


			// Make sure required resources are loaded before redrawing
			if (curLoadResNum < totalLoadResources) {
				return;
			}

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
				
				// Set the drawing color
				if (clickTool[i] === "eraser") {
					//context.globalCompositeOperation = "destination-out"; // To erase instead of draw over with white
					context.strokeStyle = 'white';
				} else {
					//context.globalCompositeOperation = "source-over";	// To erase instead of draw over with white
					context.strokeStyle = clickColor[i];
				}
				context.lineCap = "round";
				context.lineJoin = "round";
				context.lineWidth = radius;
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
			postJSON('http://localhost:9000/api/walls/' + wall.name, drawing).then(function(data) {
                wall = data;
                }, function(status) { //error detection....
                 alert('Unable to post drawing data.');
            });;
		},

		// Add mouse and touch event listeners to the canvas
		createUserEvents = function () {

			var press = function (e) {
				// Mouse down location
				var sizeHotspotStartX,
					mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft,
mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;

				if (mouseX < drawingAreaX) { // Left of the drawing area
					if (mouseX > mediumStartX) {
						if (mouseY > mediumStartY && mouseY < mediumStartY + mediumImageHeight) {
							curColor = colorPurple;
						} else if (mouseY > mediumStartY + mediumImageHeight && mouseY < mediumStartY + mediumImageHeight * 2) {
							curColor = colorGreen;
						} else if (mouseY > mediumStartY + mediumImageHeight * 2 && mouseY < mediumStartY + mediumImageHeight * 3) {
							curColor = colorYellow;
						} else if (mouseY > mediumStartY + mediumImageHeight * 3 && mouseY < mediumStartY + mediumImageHeight * 4) {
							curColor = colorBrown;
						}
					}
				} else if (mouseX > drawingAreaX + drawingAreaWidth) { // Right of the drawing area

					if (mouseY > toolHotspotStartY) {
						if (mouseY > sizeHotspotStartY) {
							sizeHotspotStartX = drawingAreaX + drawingAreaWidth;
							if (mouseY < sizeHotspotStartY + sizeHotspotHeight && mouseX > sizeHotspotStartX) {
								if (mouseX < sizeHotspotStartX + sizeHotspotWidthObject.huge) {
									curSize = "huge";
								} else if (mouseX < sizeHotspotStartX + sizeHotspotWidthObject.large + sizeHotspotWidthObject.huge) {
									curSize = "large";
								} else if (mouseX < sizeHotspotStartX + sizeHotspotWidthObject.normal + sizeHotspotWidthObject.large + sizeHotspotWidthObject.huge) {
									curSize = "normal";
								} else if (mouseX < sizeHotspotStartX + sizeHotspotWidthObject.small + sizeHotspotWidthObject.normal + sizeHotspotWidthObject.large + sizeHotspotWidthObject.huge) {
									curSize = "small";
								}
							}
						} else {
							if (mouseY < toolHotspotStartY + toolHotspotHeight) {
								curTool = "crayon";
							} else if (mouseY < toolHotspotStartY + toolHotspotHeight * 2) {
								curTool = "marker";
							} else if (mouseY < toolHotspotStartY + toolHotspotHeight * 3) {
								curTool = "eraser";
							}
						}
					}
				}
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

			curLoadResNum += 1;
			if (curLoadResNum === totalLoadResources) {
				redraw();
				createUserEvents();
			}
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
			//var wallId = Math.floor((Math.random() * 10) + 1);
			var wallId = 1;
			outlineImage.src = "assets/images/defensedafficher" + wallId + ".jpg";
			getJSON('http://localhost:9000/api/walls/' + wallId).then(function(data) {
                wall = data;
                var i;
                for (i = 0; i < data.drawings.length; i += 1) {
                    clickX = clickX.concat(data.drawings[i].x);
                    clickY = clickY.concat(data.drawings[i].y);
                    clickColor = clickColor.concat(data.drawings[i].color);
                    clickSize = clickSize.concat(data.drawings[i].size);
                    clickDrag = clickDrag.concat(data.drawings[i].drag);
                    clickTool = clickTool.concat(data.drawings[i].tool);
                }
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
		};

	return {
		init: init
	};
}());