/*
 * Copyright (C) 2015 Intel Corporation. All rights reserved.
 */

 /*
  * This script initalizes Yandex Maps widgets with your application
  *
  * You can get to any instantiated Yandex Maps object by using the export
  * yandexMaps.getObjectBySelector(selector) and using an id/class to retrieve it.
  * Similarly, you can use getMarkersByID(selector) to get markers for a
  * particular map.
  *
  * After getting the object you may use any of the normal Yandex Maps Javascript
  * V3 API calls.  Example:
  *
  * var map = yandexMaps.getObjectBySelector('#myMap');
  * map.setCenter(new yandex.maps.LatLng(40.000, -100.000));
  *
  * For more information about the Yandex Maps API visit:
  * http://api.yandex.com/maps/doc/jsapi/2.x/dg/concepts/index.xml
  *
  */
  /* global ymaps:false */
(function() {

  'use strict';
  window.yandexMaps = {};

  /**
   *  yandexMaps.js - Generic code for stand alone or data-feed Yandex Maps
   *
   *  @exports getObjectBySelector(selector)
   *  @exports getMarkersByID(selector)
   *
   */
  var maps = [];

  /**
   * Waits for deviceready event from Cordova and then calls init to create
   * maps and set event handlers for service calls.  We then initiate any
   * service call that needs to happen after initalize is done.
   *
   */
  var deferred = function(){
    init();
    callService();
  };
  document.addEventListener('app.Ready', deferred, false);


  /**
   * Initalize finds all the maps on the page and gathers the relevant data attributes.
   * It then initalizes all the maps with the gathered data, depending on whether
   * it is a single marker map or a datafeed map.
   *
   */
  function init() {
    findMaps();
    initalizeMaps();
  }

  /**
   * Queries the document for all data-uib matching yandexMaps.  It then loops through
   * the results and gatheres all the data attributes and pushes then to the maps array.
   *
   */
  function findMaps() {
    var mapQuery = document.querySelectorAll('[data-uib="media/yandex_maps"]');
    for(var i = 0; i < mapQuery.length; i++) {
      var mapsData = {};
      var elem = mapQuery[i];
      mapsData.mapDOMNode = elem;
      mapsData.dataEvent = elem.getAttribute('data-sm');
      mapsData.dataRpa = elem.getAttribute('data-rpath');
      mapsData.dataZoom = elem.getAttribute('data-zoom');
      mapsData.dataCenterAddress = elem.getAttribute('data-center-address');
      mapsData.dataCenterLat = elem.getAttribute('data-center-latitude');
      mapsData.dataCenterLong = elem.getAttribute('data-center-longitude');
      mapsData.dataCenterAuto = elem.getAttribute('data-center-auto');
      mapsData.dataMapType = elem.getAttribute('data-map-type');
      mapsData.dataGeoObjectType = elem.getAttribute('data-geo-object-type');
      mapsData.dataLat = elem.getAttribute('data-lat');
      mapsData.dataLong = elem.getAttribute('data-long');
      mapsData.dataRadius = elem.getAttribute('data-radius');
      mapsData.dataCoordinates = JSON.parse('['+elem.getAttribute('data-coordinates') + ']');
      mapsData.dataBalloon = elem.getAttribute('data-balloon');
      mapsData.dataBalloonHeader = elem.getAttribute('data-balloon-header');
      mapsData.dataBalloonBody = elem.getAttribute('data-balloon-body');
      mapsData.dataBalloonFooter = elem.getAttribute('data-balloon-footer');
      mapsData.dataHint = elem.getAttribute('data-hint');
      mapsData.dataPreset = elem.getAttribute('data-preset');
      mapsData.dataDraggable = elem.getAttribute('data-draggable');
      maps.push(mapsData);
    }
  }

  /**
   * InitalizeMaps creates a base map for all nodes found and then determines whether the
   * data will be feed through a service or as a standalone map.  It then creates one or more
   * markers based on data.
   *
   */
  function initalizeMaps() {
    maps.forEach(function(map){
      createMap(map);
      if(map.dataEvent) {
        $(document).on('intel.xdk.services.' + map.dataEvent, function(evt, data){
          clearMarkers(map);
          createMarkers(map, data);
        });
      } else {
        createMarker(map);
      }
    });
  }

  /**
   * Create Map will gather the zoom and center data as those are required for creating a map.
   * It will check whether there is a lat/long used for the center, if not, it will use a default
   * lat/long of 40, -100 (United States) and create the map.  It will then check after it's done
   * whether there was an address for the center that needs to be geocoded. It also sets map parameters
   * (map type)
   *
   * @param {Object} mapObject - Contains data about map for creation
   */
  function createMap(mapObject) {
    var mapOptions = {};
    mapOptions.zoom = mapZoom(mapObject);
    if (!!mapObject.dataCenterLat && !!mapObject.dataCenterLong &&
        parseFloat(mapObject.dataCenterLat) && parseFloat(mapObject.dataCenterLong)) {
      mapOptions.center = [parseFloat(mapObject.dataCenterLat), parseFloat(mapObject.dataCenterLong)];
    } else {
      mapOptions.center = [40.0000, -100.0000];  // Required Map Center
    }
    mapObject.map_object = new ymaps.Map(mapObject.mapDOMNode, mapOptions);
    geocodeAddress(mapObject);
    setMapParameters(mapObject);
  }

  /**
   * Create Marker is used for creating a single marker.  It will gather the information
   * from the mapObject and use those values for the marker.
   *
   * @param {Object} mapObject - Contains data about map for creation
   */
  function createMarker(mapObject) {
    var marker = {};
    marker.geometry = markerGeometry(mapObject);
    marker.properties = markerProperties(mapObject);
    marker.options = markerOptions(mapObject);
    if(marker.geometry) {
      mapObject.marker = new ymaps.GeoObject(marker);
      mapObject.map_object.geoObjects.add(mapObject.marker);
    }
  }

  /**
   * Create Markers is used when a service is creating the locations.  It will determine the correct
   * path for gathering the data and then loop through each one gathering certain values for creating
   * the marker.
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   */
  function createMarkers(mapObject, data) {
    mapObject.markers = [];
    var dataRpa = JSON.parse(mapObject.dataRpa);
    dataRpa.forEach(function(d){ data = data[d]; });
    data = filter(data, isObject);

    for( var i = 0; i < data.length; i++ ) {
      var marker      = {};
      var dataItem    = data[i];
      marker.geometry = markerGeometry(mapObject, dataItem);
      marker.properties = markerProperties(mapObject, dataItem);
      marker.options = markerOptions(mapObject, dataItem);
      if(marker.geometry) {
        var markerObject = new ymaps.GeoObject(marker);
        mapObject.markers.push(markerObject);
        mapObject.map_object.geoObjects.add(markerObject);
      }
    }
  }

  /**
   * Clear Markers is called when a service call is a triggered so remove all of the old
   * markers on the map before creating any new ones.  To do this you must remove each marker
   * to from the geoobjects list of the map and then remove all references of them from their
   * reference array.
   *
   * @param {Object} mapObject - Contains data about map for creation
   */
  function clearMarkers(mapObject) {
    if(!mapObject.markers) return;
    //Iterate through markers array and remove each from the map.
    for( var i = 0; i < mapObject.markers.length; i++) {
      mapObject.map_object.geoObjects.remove(mapObject.markers[i]);
    }
    //Zero array to remove references to markers
    mapObject.markers = [];
  }

  /**
   * Call Service will look through all the maps on the page and find whether any of them have
   * a data event.  It will then go through all of the namespaces and add it to 'intel.xdk.services'
   * to create a function call.
   */
  function callService(){
    for(var i = 0; i < maps.length; i++){
      if(!!maps[i].dataEvent) {
        var splitString = maps[i].dataEvent.split('.');
        var func = window.intel.xdk.services;
        for(var j = 0; j < splitString.length; j++){
          func = func[splitString[j]];
        }
        func();
      }
    }
  }

  /**
   * Geocode Address will check for a map center address and then call out to the Geocoder.
   * If it successfully returns it will set the map to the newly returned lat/long.
   *
   * @param {Object} mapObject - Contains data about map for creation
   */
  function geocodeAddress(mapObject) {
    if(!!mapObject.dataCenterAddress) {
      ymaps.geocode(mapObject.dataCenterAddress)
      .then(function(res) {
          mapObject.map_object.setCenter(res.geoObjects.get(0).geometry.getCoordinates());
        }, function() {
        throw 'Geocoding failed';
      });
    }
  }

  /**
   * Map parameters is only being used to set the map type right now.
   *
   * @param {Object} mapObject - Contains data about map for creation
   */
  function setMapParameters(mapObject) {
    mapObject.map_object.setType('yandex#' + mapObject.dataMapType);
  }

  /**
   * Map Zoom will check whether there is a zoom value and return it's value; otherwise, it will
   * return 8
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @returns {Int} Value of the map zoom
   */
  function mapZoom(mapObject) {
    if(!!mapObject.dataZoom && parseInt(mapObject.dataZoom)) {
      return parseInt(mapObject.dataZoom);
    } else {
      return 8;
    }
  }

  /**
   * Marker Geometry will determine the type of marker. The details about these
   * markers can be found here
   * http://api.yandex.com/maps/doc/jsapi/2.x/dg/concepts/geoobjects.xml
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   * @returns {Object} Geometry of the object
   */
  function markerGeometry(mapObject, dataItem) {
    var latlong = markerLatLong(mapObject, dataItem);
    var radius = markerRadius(mapObject,dataItem);
    var coordinatesArray = markerCoordinatesArray(mapObject,dataItem);
    var geometry = {type : mapObject.dataGeoObjectType};
    switch(mapObject.dataGeoObjectType) {
      case 'Point' :
        geometry.coordinates = latlong;
        break;
      case 'Circle' :
        geometry.coordinates = latlong;
        geometry.radius = radius;
        break;
      case 'Polygon' :
      case 'Rectangle' :
      case 'LineString' :
        geometry.coordinates = coordinatesArray;
        break;
    }
    return geometry;
  }

  /**
   * Marker Lat Long will check for a lat/long position and will return a new LatLng based on those values.
   * Otherwise, it will attempt to strip the mustache syntax since it's likely a lat/long from a service.
   * It will then gather the information from the data feed and create a new LatLng from those values.
   *
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   * @returns [Lat, Long] - Position for the marker to be placed on the map
   */
  function markerLatLong(mapObject, dataItem){
    if(!!parseFloat(mapObject.dataLong) && !!parseFloat(mapObject.dataLat)) {
      return [mapObject.dataLat, mapObject.dataLong];
    } else if(!!mapObject.dataLong && !!mapObject.dataLat) {
      var latObj = getValue (mapObject.dataLat, dataItem);
      var lngObj = getValue (mapObject.dataLong, dataItem);
      return [latObj, lngObj];
    }
  }

  /**
   * Marker Radius Array will determine the radius of the circle geobject
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   * @returns  {Int} : Value of the radius
   */
  function markerRadius(mapObject, dataItem){
    if(!!parseFloat(mapObject.dataRadius)) {
      return mapObject.dataRadius;
    } else if(!!mapObject.dataRadius) {
      var radius = getValue(mapObject.dataRadius, dataItem);
      return radius;
    }
  }

  /**
   * Marker Coordinates Array will determine the array of coordinates for geo objects that are
   * a closed shape - polygon, rectangle, linestring.
   * The coordinates mark the vertices of these shapes.
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   * @returns {Array} : Array of coordinates for the geoobject shape.
   */
  function markerCoordinatesArray(mapObject, dataItem){
    if(!!parseFloat(mapObject.dataCoordinates)) {
      return mapObject.dataCoordinates;
    } else if(!!mapObject.dataCoordinates) {
      var coordinates = getValue(mapObject.dataCoordinates, dataItem);
      return coordinates;
    }
  }

  /**
   * Marker Options will determine the options of the marker.
   * The options define the preset style and if the marker is draggable or not.
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   * @returns {Object} Options of the marker defining the preset and isDraggable
   */
  function markerOptions(mapObject /*, dataItem */) {
    var options = {};
    options.preset = mapObject.dataPreset;
    options.draggable = mapObject.dataDraggable;
    return options;
  }

  /**
   * Marker Properties will determine the properties of the marker.
   * The properties define the balloon and hint associated with the marker.
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   * @returns {Object} Properties of the marker defining the balloon and hint
   */
  function markerProperties(mapObject, dataItem) {
    var properties = {};
    properties = markerBalloon(mapObject,dataItem);
    properties.hintContent = markerHint(mapObject, dataItem);
    return properties;
  }

  /**
   * Marker Balloon will determine whether the balloon  is part of a service feed, a standalone balloon, or
   * no balloon.  It will then gather the appropriate balloon content depending on the type.
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   * @returns {Object} Balloon of the marker or null with its header, body and footer html elements
   */
  function markerBalloon(mapObject, dataItem){
    var balloon = {};
    if(!!mapObject.dataBalloon && !!mapObject.dataBalloonHeader && !!mapObject.dataBalloonBody && !!mapObject.dataBalloonFooter && !!dataItem) {
      balloon.balloonContentHeader = getValue(mapObject.dataBalloonHeader, dataItem);
      balloon.balloonContentBody = getValue(mapObject.dataBalloonBody, dataItem);
      balloon.balloonContentFooter = getValue(mapObject.dataBalloonFooter, dataItem);
    } else if(!!mapObject.dataBalloon && !!mapObject.dataBalloonHeader && !!mapObject.dataBalloonBody && !!mapObject.dataBalloonFooter && !dataItem) {
      balloon.balloonContentHeader = mapObject.dataBalloonHeader;
      balloon.balloonContentBody = mapObject.dataBalloonBody;
      balloon.balloonContentFooter = mapObject.dataBalloonFooter;
    }
    return balloon;
  }

  /**
   * Marker Hint will determine whether the hint  is part of a service feed, a standalone hint, or
   * no hint.  It will then gather the appropriate hint content depending on the type.
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @param {Object} dataItem - Contains data about the service feed
   * @returns {String} Hint of the marker or null
   */
  function markerHint(mapObject, dataItem) {
    if(!!mapObject.dataHint && !!dataItem) {
      var hint = getValue(mapObject.dataHint, dataItem);
      return hint;
    } else if( !!mapObject.dataHint && !dataItem) {
      return mapObject.dataHint;
    } else {
      return null;
    }
  }

  /**
   *  Get Value from the service feed
   *
   * @param {String} valueHolder - The value provided by user
   * @param {Object} dataItem - Contains data about the service feed
   * @returns {String} The value obtained from the service food
   */
  function getValue(valueHolder, dataItem) {
    var strippedValueHolder = stripEntry(valueHolder);
    return getNamespacedObject(strippedValueHolder.split('.'), dataItem);
  }

  /**
   *  Filter function
   *
   * @param [Array] arr - Objects that are gathered from service data path
   * @param {function} predicate - Data must pass through this conditional or will be filtered
   */
  function filter(arr, predicate) {
    var i, res = [];
    for(i=0; i < arr.length; i++){ if(predicate(arr[i])){ res.push(arr[i]); } }
    return res;
  }

  /**
   *  Determines whether an item is an object
   *
   * @param {Object} e - element that will be compared to an object
   */
  function isObject(e) {
    return typeof(e) == 'object';
  }

  /**
   * Attemps to trim off the mustache style syntax from an entry.  If the syntax is not correctly used
   * it will return the original string; otherwise, it will return the inner value.
   *
   * @param {Object} mapObject - Contains data about map for creation
   * @returns {String} - Either a trimmed mustache entry or original entry depending on match
   */
  function stripEntry(entry) {
    var match = entry.match(/\{\{(?:entry.)?([\w\W]*)\}\}/);
    return !!match && match.length == 2 ? match[1] : entry;
  }

  /**
    * Takes an array of parts, a string split by '.', and attempts to look through
    * data and find the corresondping object
    *
    * @param {Array} - Array of strings split by '.'
    * @param {Object} - Base path to search in data feed response
    * @return {Object} - Empty object or fully qualified object path
    */
  function getNamespacedObject(parts, data) {
    for (var i = 0, len = parts.length, obj = data[0] || data; i < len; ++i) {
      obj = obj[parts[i]];
    }
    return obj || {};
  }

  /**
   * Given a query selector it will attempt to search for that DOM node and then compare it with
   * values stored in the private maps variable.  If it finds a match it will then return the
   * Yandex Maps object that can be used to modify the map using anything from the YandexMaps
   * Javascript v2 API or else it will return null.
   *
   * http://api.yandex.com/maps/doc/jsapi/2.x/overview/concepts/about.xml
   *
   * @param {String} mapSelector - Contains data about map for creation
   * @returns {Object} - Maps object
   */
  window.yandexMaps.getObjectBySelector = function(mapSelector) {
    var map = null;
    var domNode = document.querySelectorAll(mapSelector);
    if(domNode.length !== 0) {
      maps.forEach(function(item) {
        if(domNode[0] == item.mapDOMNode) {
          map = item.map_object;
        }
      });
    }
    return map;
  };

  /**
   * Similar to yandexMaps.getObjectBySelector except it will return an array of markers that are used
   * for the selected map.
   *
   * @param {String} mapSelector - Contains data about map for creation
   * @returns {Array} - Array of Map Markers for a given map
   */
  window.yandexMaps.getMarkersByID = function(mapSelector) {
    var map = null;
    var domNode = document.querySelectorAll(mapSelector);
    if(domNode.length !== 0) {
      maps.forEach(function(item) {
        if(domNode[0] == item.mapDOMNode) {
          map = item.markers;
        }
      });
    }
    return map;
  };

})();
