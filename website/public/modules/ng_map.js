var map = (function(){
  // 'use strict';
  return {
    // GOOGLE MAP

    // Helper: Check that geo coordinates are within the proper latitude and longitude ranges.
    numberInRange: (function (start, end, val) {
      if (val >= start && val <= end) {
        return true;
      }
      return false;
    }),

    getCoordinates: (function(d){
      try {
        var _coords = {"latitude": 0, "longitude": 0};
        var _coords_len = d.geo.geometry.coordinates.length;
        // start building map marker(s)
        if (_coords_len == 2 || _coords_len == 3) {
          // get coordinate values
          // GEOJSON specifies [ LONGITUDE , LATITUDE, ELEVATION (optional)]
          var lon = d.geo.geometry.coordinates[0];
          // console.log("longitude: " + lon);
          var lat = d.geo.geometry.coordinates[1];
          // console.log("lat: " + lat);
          // check if values are in range
          lonValid = map.numberInRange(-180, 180, lon);
          latValid = map.numberInRange(-90, 90, lat);
          // both values are in the correct ranges
          if (latValid && lonValid) {
            // start making the marker on the map
            // console.log("two valid coordinates pt 1");
            _coords.latitude = lat;
            _coords.longitude = lon;
          } else {
            // Try swapping the coordinates, to see if that's why it didn't work.
            lonValid = map.numberInRange(-180, 180, lat);
            latValid = map.numberInRange(-90, 90, lon);
            if (latValid && lonValid) {
              // console.log("two valid coordinates (when swapped)");
              // start making the marker on the map
              _coords.latitude = lon;
              _coords.longitude = lat;
            }
          }
        }
        // console.log("sending back coordinates");
        // console.log(_coords);
        return _coords;
      } catch (err) {
        console.log("map.getCoordinates: " + err);
        return {"latitude": 0, "longitude": 0};
      }
    }),

    updateMap: (function (map, coordinates) {
      map.center = {"latitude": coordinates.latitude, "longitude": coordinates.longitude };
      map.zoom = 3;
      // console.log("sending back map");
      // console.log(map);
      return map;
    }),

    // Add another set of coordinates to the map
    addMarker: (function (mapMarkers, coordinates) {
      try {
        // geoMarker IDs are sequential
        var newID = mapMarkers.length + 1;
        // push the marker and it's default options to the array of geoMarkers
        mapMarkers.push({
          id: newID,
          longitude: coordinates.longitude,
          latitude: coordinates.latitude,
          options: {
            draggable: true
          },
          events: {
            dragend: function dragend(marker, eventName, args) {
              mapMarkers.options = {
                draggable: true,
                labelContent: "lat: " + coordinates.latitude + ' ' + 'lon: ' + coordinates.longitude,
                labelAnchor: "100 0",
                labelClass: "marker-labels"
              };
            }
          }
        });
      } catch(err) {
        console.log("map.addMarker: " + err);
      }
      return mapMarkers;
    }),

  }; // end return

  }());
