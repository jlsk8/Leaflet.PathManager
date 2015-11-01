# Leaflet.PathManager
Plugin for Leaflet which handle paths and areas features.

For example add an restriction area for a path then when you add a position to this path he gets around.

## Version & Compatibilty

Actual version is **0.1** (not a lot of feature and some bugs can become..)

Compatible with **Leaflet 1.0 (beta)**, working on compatibility with leaflet 0.7.7 (stable version)

## Using the plugin
For using the plugin you must initializing it before :
```js
P.init(layer);
```
*layer* is the layer which will contains all paths and areas objets, you can use the  Leaflet map.

### Path Object

For creating an new path :
```js var pathObject = P.createPath([<Path Options>]);```
Method to get all paths :
```js var allPaths = P.getAllPaths();```

**Object Method**

| Method | Description
| --- | ---
| ``addPos(<LatLng> [, animation])`` | Add a position to the path, with animation (none if animation == 0)
| ``getPos([index])`` | If an index is specified return corresponding position (``<LatLng>``) else return all positions (``<LatLng[]>``)
| ``clean()`` | Remove all position from path
| ``setStyle(<Path options>)`` | Update path style
| ``remove()`` | Destroy path object
| ``addRestriction(<Area Object> or areaId)`` | Set area to restriction for current path
| ``removeRestriction([<Area Object> or areaId])`` | Remove area to restriction for current path (if no args, remove all restrictions)
| ``getRestrictions()`` | Return all area which restrict current path

**Path Options**

```js var pathOptions = {
[positions: <LatLng[]>,]
[style: <Path options>,]
[animation: 0]
};```

*positions* is for adding positions on creating, *style* is for define an style to path and *animation* is for define default animation for the path.

### Area Object

For creating an new area :
```js var areaObject = P.createArea([<Area Options>]);```
Method to get all areas :
```js var allAreas = P.getAllAreas();```

**Object Method**

| Method | Description
| --- | ---
| ``addPos(<LatLng>)`` | Add a position to the area
| ``getPos([index])`` | If an index is specified return corresponding position (``<LatLng>``) else return all positions (``<LatLng[]>``)
| ``clean()`` | Remove all position from area
| ``setStyle(<Path options>)`` | Update are style
| ``remove()`` | Destroy area object
| ``hide()`` | Hide area
| ``display`` | Display area (after hidding)

**Area Options**

```js var areaOptions = {
[positions: <LatLng[]>,]
[style: <Path options>]
};```

*positions* is for adding positions on creating and *style* is for define an style to area.