var PathManager = (function () {

	var instance;

	var global = {
		pathLayer: null,
		idPath:    0,
		idArea:    0
	};

	var Paths = [];
	var Areas = [];

	var constructor = function () {

		var Path = function (id) {

			this.id = id;
			this.animation = 0;
			this.layer = null;
			this.animInterval = null;
			this.restrictions = [];

			this.init = function (pathLayer, object) {
				var values = (object && object.positions ? object.positions : []);
				if (object && object.animation) {

				}
				this.animation = (object && object.animation ? object.animation : 0);
				this.layer = L.polyline(values, {color: "#c0392b", opacity: 1, weight: 3});		
				if (object && object.style) {
					this.layer.setStyle(object.style);
				}
				pathLayer.addLayer(this.layer);
			};

			this.addPos = function (position, animation) {
				clearInterval(this.animInterval);

				if (!position.lat) {
					position = {lat: position[0], lng: position[1]};
				}
				var firstPoint = function () {

					var isInPolygon = function (polygon, point) {
						var result = false;
						var n = polygon.length;
						var y = point.lat;
						var x = point.lng;
						for (var i = 0, j = n - 1; i < n; j = i++) {
							if (((polygon[i].lat < y && y < polygon[j].lat) || (polygon[j].lat < y && y < polygon[i].lat))
								&& (x < (polygon[j].lng - polygon[i].lng) * (y - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng)) {
								result = !result;
							}
						}
						return result;
					};

					for (var i = allPolygon.length - 1; i >= 0; i--) {
						if (isInPolygon(allPolygon[i], position)) {
							return false;
						}
					};
					layer.addLatLng(position);
				};

				var layer = this.layer;
				var newPositions = [];

				var allPolygon = [];
				for (var i = 0; i < this.restrictions.length; i++) {
					var areaId = this.restrictions[i];
					for (var j = 0; j < Areas.length; j++) {
						if (Areas[j].id == areaId) {
							allPolygon.push(Areas[j].getPos());
						}
					};
				};

				if (layer._latlngs.length == 0) {
					firstPoint();
				} else {
					var getShortestPath = function (a, b) {
						
						var pointInPolygons = function (point) {
							var result = false;
							var y = point.lat;
							var x = point.lng;
							for (var polyI = 0; polyI < allPolygon.length; polyI++) {
								var polygon = allPolygon[polyI];
								for (var i = 0; i < polygon.length; i++) {
									var j = i + 1;
									if (j == polygon.length) {
										j = 0;
									}
									if (((polygon[i].lat < y && polygon[j].lat >= y) || (polygon[j].lat < y && polygon[i].lat >= y))
										&& (x > (y - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) * (polygon[j].lng - polygon[i].lng) + polygon[i].lng)) {
										result = !result;
									}
								}
							}
							return result;
						};

						var lineInPolygons = function (a, b) {
							var aX = a.lng;
							var aY = a.lat;
							var bX = b.lng - aX;
							var bY = b.lat - aY;
							var distance = Math.sqrt(bX * bX + bY * bY);
							var cos = bX / distance;
							var sin = bY / distance;

							for (var polyI = 0; polyI < allPolygon.length; polyI++) {
								var polygon = allPolygon[polyI];
								for (var i = 0; i < polygon.length; i++) {
									var j = i + 1;
									if (j == polygon.length) {
										j = 0;
									}
									if ((a == polygon[i] && b == polygon[j]) || (a == polygon[j] && b == polygon[i])) {
										return true;
									}
									var cX = polygon[i].lng - aX;
									var cY = polygon[i].lat - aY;
									var dX = polygon[j].lng - aX;
									var dY = polygon[j].lat - aY;

									if ((cX == 0 && cY == 0 && dX == bX && dY == bY)
										|| (dX == 0 && dY == 0 && cX == aX && cY == aY)) {
										return true;
									}

									var rotAX = cX * cos + cY * sin;
									var rotAY = cY * cos - cX * sin;
									var rotBX = dX * cos + dY * sin;
									var rotBY = dY * cos - dX * sin;

									if ((rotAY < 0 && rotBY > 0) || (rotBY < 0 && rotAY > 0)) {
										var cross = rotAX + (rotBX - rotAX) * (0 - rotAY) / (rotBY - rotAY);
										if (cross >= 0 && cross <= distance) {
											return false;
										}
									}

									if (rotAY == 0 && rotBY == 0 && (rotAX >= 0 || rotBX >= 0)
										&& (rotAX <= distance || rotBX <= distance)
										&& (rotAX < 0 || rotBX < 0 || rotAX > distance || rotBX > distance)) {
										return false;
									}
								}
							}
							var middle = {lat: aY + bY / 2, lng: aX + bX / 2};
							return !pointInPolygons(middle);
						};

						var getDistance = function (a, b) {
							var x = b.lng - a.lng;
							var y = b.lat - a.lat;
							return Math.sqrt(x * x + y * y);
						};

						if (pointInPolygons(a) || pointInPolygons(b)) {
							return null;
						}
						if (lineInPolygons(a, b)) {
							return [];
						}

						var pointList = [a];
						for (var i = 0; i < allPolygon.length; i++) {
							pointList = pointList.concat(allPolygon[i]);
						};
						pointList.push(b);

						var treeCount = 1;
						pointList[0].totalDist = 0;
						var bestI = 0;
						var bestJ = 0;

						while (bestJ < pointList.length - 1) {
							var bestDist = Infinity;
							for (var i = 0; i < treeCount; i++) {
								for (var j = treeCount; j < pointList.length; j++) {
									if (lineInPolygons(pointList[i], pointList[j])) {
										var newDist = pointList[i].totalDist + getDistance(pointList[i], pointList[j]);
										if (newDist < bestDist) {
											bestDist = newDist;
											bestI = i;
											bestJ = j;
										}
									}
								}
							}
							if (bestDist == Infinity) {
								return null;
							}
							pointList[bestJ].prev = bestI;
							pointList[bestJ].totalDist = bestDist;
							var tmp = pointList[bestJ];
							pointList[bestJ] = pointList[treeCount];
							pointList[treeCount] = tmp;

							treeCount++;
						}

						var i = treeCount - 1;
						var solutions = [];

						while (i > 0) {
							i = pointList[i].prev;
							if (i > 0) {
								solutions.push({lat: pointList[i].lat, lng: pointList[i].lng});
							}
						}
						solutions.reverse();
						return solutions;
					};

					var oldPosition = layer._latlngs[layer._latlngs.length - 1];
					var result = getShortestPath(oldPosition, position);
					newPositions = result.concat(position);

					var animationLoop = function () {
						if (animatePos[index] == true) {
							layer.addLatLng({lat: animatePos[index - 1].lat, lng: animatePos[index - 1].lng});
						}
						layer._latlngs[layer._latlngs.length - 1].lat = animatePos[index].lat;
						layer._latlngs[layer._latlngs.length - 1].lng = animatePos[index].lng;
						layer.redraw();
						index++;
						if (index == animatePos.length - 1) {
							clearInterval(interval);
							layer._latlngs[layer._latlngs.length - 1].lat = newPos.lat;
							layer._latlngs[layer._latlngs.length - 1].lng = newPos.lng;
							layer.redraw();
						}
					};

					var animationRender = function () {
						var oldPosition = layer._latlngs[layer._latlngs.length - 1];
						for (var i = 0; i < newPositions.length; i++) {
							var elem = newPositions[i];
							var newPos = (elem.lat ? elem : {lat: elem[0], lng: elem[1]});
							var v = [newPos.lat - oldPosition.lat, newPos.lng - oldPosition.lng];
							var d = Math.sqrt((v[0] * v[0]) + (v[1] * v[1]));
							var remaining = d / speed * 10;
							var vInterval = [v[0] / remaining, v[1] / remaining];
							for (var j = 0; j < remaining - 1; j++) {
								var old = (animatePos.length == 0 ? oldPosition : animatePos[animatePos.length - 1]);
								if (old == true) {
									old = oldPosition;
								}
								var elem = {lat: old.lat + vInterval[0], lng: old.lng + vInterval[1]};
								animatePos.push(elem);
							}
							animatePos.push(newPositions[i]);
							animatePos.push(true);
							oldPosition = newPositions[i];
						}
						oldPosition = layer._latlngs[layer._latlngs.length - 1];
						layer.addLatLng({lat: oldPosition.lat, lng: oldPosition.lng});
						var interval = setInterval(animationLoop, 100);
						return interval;
					};

					var speed = animation || this.animation;
					if (speed == 0) {
						for (var i = 0; i < newPositions.length; i++) {
							var elem = newPositions[i];
							var newPos = (elem.lat ? elem : {lat: elem[0], lng: elem[1]});
							layer.addLatLng(newPos);
						}
					} else {
						var animatePos = [];
						var index = 0;
						var interval = animationRender();
						var elem = newPositions[newPositions.length - 1];
						var newPos = (elem.lat ? elem : {lat: elem[0], lng: elem[1]});
						this.animInterval = interval;
					}
				}
			};

			this.getPos = function (index) {
				return (index ? this.layer._latlngs[0][index] : this.layer._latlngs[0]);
			};

			this.remove = function () {
				this.layer.remove();
			};

			this.clean = function () {
				this.layer._latlngs = [];
				this.layer.redraw();
			};

			this.setStyle = function (style) {
				this.layer.setStyle(style);
			};

			this.addRestriction = function (value) {
				if (typeof value == "array") {
					for (var i = value.length - 1; i >= 0; i--) {
						this.restrictions.push(value[i].id);
					};
				} else if (typeof value != "undefined") {
					this.restrictions.push(value.id);
				}
			};

			this.removeRestriction = function (value) {
				if (typeof value == "array") {
					for (var i = value.length - 1; i >= 0; i--) {
						var index = this.restrictions.indexOf(value[i].id);
						this.restrictions.splice(index, 1);
					};
				} else if (typeof value != "undefined") {
					var index = this.restrictions.indexOf(value.id);
					this.restrictions.splice(index, 1);
				} else {
					this.restrictions = [];
				}
			};

			this.getRestrictions = function () {
				var res = [];
				for (var i = this.restrictions.length - 1; i >= 0; i--) {
					res.push(Areas[this.restrictions[i]]);
				};
				return res;
			};
		};

		var Area = function (id) {

			this.id = id;
			this.layer = null;

			this.init = function (pathLayer, object) {
				var values = (object && object.positions ? object.positions : []);
				this.layer = L.polygon(values, {color: "#444", opacity: 1, weight: 2});
				if (object && object.style) {
					this.layer.setStyle(object.style);
				}
				pathLayer.addLayer(this.layer);
			};

			this.addPos = function (position) {
				this.layer.addLatLng(position);
			};

			this.getPos = function (index) {
				return (index ? this.layer._latlngs[0][index] : this.layer._latlngs[0]);
			};

			this.remove = function () {
				this.layer.remove();
			};

			this.clean = function () {
				this.layer._latlngs = [];
				this.layer.redraw();
			};

			this.hide = function () {
				this.layer.setStyle({opacity: 0, fillOpacity: 0});
			};

			this.display = function () {
				this.layer.setStyle({opacity: 1, fillOpacity: 0.2});
			};

			this.setStyle = function (style) {
				this.layer.setStyle(style);
			};
		};

		var init = function (map) {
			global.pathLayer = new L.layerGroup();
			global.pathLayer.addTo(map);
		};

		var createPath = function (object) {
			var path = new Path(global.idPath++);
			path.init(global.pathLayer, object);
			Paths.push(path);
			return path;
		};

		var createArea = function (object) {
			var area = new Area(global.idArea++);
			area.init(global.pathLayer, object);
			Areas.push(area);
			return area;
		};

		var getAllPaths = function () {
			return Paths;	
		};

		var getAllAreas = function () {
			return Areas;	
		};

		return {
			init:        init,
			createPath:  createPath,
			createArea:  createArea,
			getAllPaths: getAllPaths,
			getAllAreas: getAllAreas
		};
	};

	return function () {
		if (!instance) {
			instance = constructor();
		}

		return instance;
	};

}) ();

var P = PathManager();