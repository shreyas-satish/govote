// A mapping from assembly constituency ID to
// PC ID, PC Name, ECI District
const CONSTITUENCY_MAP = {
  "150": ["27","Chikkaballapur","BANGALORE URBAN"],
  "151": ["24","Bangalore North","B.B.M.P (NORTH)"],
  "152": ["24","Bangalore North","BANGALORE URBAN"],
  "153": ["24","Bangalore North","BANGALORE URBAN"],
  "154": ["23","Bangalore Rural","B.B.M.P (CENTRAL)"],
  "155": ["24","Bangalore North","BANGALORE URBAN"],
  "156": ["24","Bangalore North","B.B.M.P (NORTH)"],
  "157": ["24","Bangalore North","B.B.M.P (NORTH)"],
  "158": ["24","Bangalore North","B.B.M.P (NORTH)"],
  "159": ["24","Bangalore North","B.B.M.P (NORTH)"],
  "160": ["25","Bangalore Central","B.B.M.P (NORTH)"],
  "161": ["25","Bangalore Central","B.B.M.P (NORTH)"],
  "162": ["25","Bangalore Central","B.B.M.P (CENTRAL)"],
  "163": ["25","Bangalore Central","B.B.M.P (CENTRAL)"],
  "164": ["25","Bangalore Central","B.B.M.P (CENTRAL)"],
  "165": ["25","Bangalore Central","B.B.M.P (CENTRAL)"],
  "166": ["26","Bangalore South","B.B.M.P (SOUTH)"],
  "167": ["26","Bangalore South","B.B.M.P (SOUTH)"],
  "168": ["25","Bangalore Central","B.B.M.P (CENTRAL)"],
  "169": ["26","Bangalore South","B.B.M.P (CENTRAL)"],
  "170": ["26","Bangalore South","B.B.M.P (SOUTH)"],
  "171": ["26","Bangalore South","B.B.M.P (SOUTH)"],
  "172": ["26","Bangalore South","B.B.M.P (SOUTH)"],
  "173": ["26","Bangalore South","B.B.M.P (SOUTH)"],
  "174": ["25","Bangalore Central","BANGALORE URBAN"],
  "175": ["26","Bangalore South","B.B.M.P (SOUTH)"],
  "176": ["23","Bangalore Rural","BANGALORE URBAN"],
  "177": ["23","Bangalore Rural","BANGALORE URBAN"],
  "178": ["27","Chikkaballapur","BANGALORE RURAL"],
  "179": ["27","Chikkaballapur","BANGALORE RURAL"],
  "180": ["27","Chikkaballapur","BANGALORE RURAL"],
  "181": ["27","Chikkaballapur","BANGALORE RURAL"]
}

function findFeaturesContainingPoint(geojson, pointCoordinates) {
  
    const matchingFeatures = [];

    // Iterate through all features in the GeoJSON file
    geojson.features.forEach((feature) => {
      // Check if the point is inside the current feature's geometry
      const isPointInFeature = turf.booleanPointInPolygon(pointCoordinates, turf.feature(feature.geometry));

      // If the point is inside the feature, add it to the result
      if (isPointInFeature) {
        matchingFeatures.push(feature);
      }
    });

    return matchingFeatures;
}

loadJSONFile("/assets/pincodes.json").then((pincodeMap) =>{
  const pincodeInput = document.getElementById('pincode');
  pincodeInput.addEventListener('input', (e) => {
    if (e.target.value.length == 6) {
      let postOffice = pincodeMap[pincodeInput.value];
      if (postOffice) {
        document.getElementById('pincode-message').style.display="block";
        window.postOffice = document.getElementById('post-office').innerText = postOffice;
        document.getElementById('mapholder').style.display='block';
      }
    }
  });
})

// Example usage:
const geojsonFile = "/assets/bbmp-2023.geojson";

loadJSONFile("/assets/wards.json").then((wardData)=>{
  window.wardLookup = {};

  // Generate the wardLookup dictionary using the "id" key
  wardData.forEach(ward => {
    window.wardLookup[ward.id] = ward;
  });

  loadJSONFile(geojsonFile)
  .then((geojson) => {
    window.geojson = geojson
    // Initialize the map with the API key and initial center
    initializeMap('AIzaSyDrDnV4rRGx4q3SZRXt7aYSELWge6wgKMU', { lat: 12.972710, lng: 77.593049 });
  })
  .catch((error) => {
    console.error("Error loading GeoJSON file:", error);
    return [];
  });
})
// Assuming you have a function to load GeoJSON asynchronously
function loadJSONFile(jsonFile) {
  return loadFile(jsonFile).then(JSON.parse);
}

function loadFile(filePath) {
  return fetch(filePath).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${filePath}`);
    }
    return response.text();
  });
} 

function geolocate(map, marker, infowindow) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        updateLocationCallback(map, marker, userLocation, infowindow, true)
      },
      error => {
        console.error('Error getting geolocation:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    console.error('Geolocation is not supported by your browser');
  }
}
function initializeMap(apiKey, initialCenter) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);


    window.initMap = function () {
      const map = new google.maps.Map(document.getElementById('map'), {
        center: initialCenter,
        zoom: 13,
        mapTypeControl: false,
        clickableIcons: false,
        streetViewControl: false
      });

      const geolocationControl = document.createElement('div');
      geolocationControl.className = 'custom-control';
      geolocationControl.title = 'Geolocate';
      geolocationControl.innerHTML = '<img src="/assets/geolocate-icon.png" alt="Geolocate">';


      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(geolocationControl);

      // Handle geolocation when the custom control is clicked
      geolocationControl.addEventListener('click', function () {
        geolocate(map, marker, infowindow);
      });

      const marker = new google.maps.Marker({
        map: map,
        animation: google.maps.Animation.DROP,
      });

      const infowindow = new google.maps.InfoWindow();

      const autocomplete = setupAutocomplete(apiKey, map, marker, infowindow);

      // Listen for map click events
      map.addListener('click', (event) => {

        // Call the callback function with the new location
        updateLocationCallback(map, marker, event.latLng, infowindow, false);
      });
    };
  }

  function setupAutocomplete(apiKey, map, marker, infowindow) {
    const autocomplete = new google.maps.places.Autocomplete(document.getElementById('addressInput'));
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.error('Place details not found for the input:', place.name);
        return;
      }

      // Call the callback function with the new location
      updateLocationCallback(map, marker, place.geometry.location, infowindow, true);
    });

    return autocomplete;
  }

  function updateLocationCallback(map, marker, location, infowindow, center=false) {
    if(center) {
      map.setCenter(location);
    }
    map.setZoom(18);
    marker.setPosition(location);

    JSON.stringify(window.wardLookup)

    if (typeof location.lat == 'function') {
      lat = location.lat()
      lng = location.lng()
    } else {
      lat = location.lat
      lng = location.lng
    }

    features = findFeaturesContainingPoint(window.geojson, turf.point([lng, lat]));
    let details = "Not in a Bangalore Constituency"
    if (features.length == 1) {
      ward = window.ward = wardLookup[features[0].properties['id'].toString()]
      let acID = ward['ac_id'];
      let pcId = CONSTITUENCY_MAP[acID][0];
      let pcName = CONSTITUENCY_MAP[acID][1];
      let eciDistrict = CONSTITUENCY_MAP[acID][2];
      details = `<div>
      <strong>Assembly Constituency</strong>: ${ward['ac_id']} - ${ward['ac_name']}<br>
      <strong>District</strong>: ${eciDistrict}<br>
      <br>Parliamentary Constituency: <br>${pcId} - ${pcName}<br>
      <br>Ward: <br>${ward['id']} - ${ward['name']}
      </div>`;

      console.log(details)

      document.getElementById('location-details').innerHTML = details;
    }
    infowindow.setContent(details);
    infowindow.open(map, marker);
  }