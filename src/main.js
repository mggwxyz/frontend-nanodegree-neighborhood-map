/*jslint browser: true */
/*global window: false */
import {Loader} from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: 'AIzaSyCiBpLlS2nUY1NlBn1tM8If10sdIGm6o8I',
  version: 'weekly',
  libraries: ['places', 'visualization', 'maps']
});

// Global variables
var google,
  map,
  userPosition,
  infoWindow,
  placesService,
  markerService,
  LAT = 38.9072,
  LNG = -77.0369;

// Knockout ViewModel
function ViewModel(searchText) {
  'use strict';

  //Initialize local variables for ViewModel
  var self = this; // Variable self refers to ViewModel to clear up 'this' confusion
  var placesHelper = new PlacesHelper(); // Object is used for calls to Google Places API
  var initialized = false; // Variable to tell if the map has initialized or not

  // Initialize Knockout observables
  self.searchText = ko.observable(searchText); // Observable for search input text
  self.filterText = ko.observable(''); // Observable for filter input text
  self.places = ko.observableArray([]); // Obserable Array for all places in list
  self.loadingPlaces = ko.observable(true);

  // KO computed observable that watches changes to the search observable and queries Google Places for relevant places
  self.search = ko.computed(function () {
    // Only search if search text is not empty
    if (self.searchText().trim() !== '') {
      placesHelper.getPlaces(self.searchText().trim());

      // Otherwise clear out the list if there is no search text
    } else {
      self.clearPlaces();
    }
  });

  /*
   * KO computed observable that watches changes to the filter observable then
   * removes places from list and map base on filter entered
   */
  self.filter = ko.computed(function () {
    var filterText = self.filterText();

    // If filter is empty, show all places
    if (!filterText || filterText.trim() === '') {
      self.places().forEach(function (place) {
        place.show(true);
        if (place.marker && typeof place.marker.setVisible === 'function') {
          place.marker.setVisible(true);
        }
      });
      return;
    }

    var regex = new RegExp(filterText, 'i');

    self.places().forEach(function (place) {
      var shouldShow = place.name.search(regex) !== -1;

      // Update the show observable for the list view
      place.show(shouldShow);

      // Update marker visibility if Google Maps is loaded and marker exists
      if (place.marker && typeof place.marker.setVisible === 'function') {
        place.marker.setVisible(shouldShow);

        // Close infoWindow if the filtered place was being displayed
        if (
          !shouldShow &&
          infoWindow &&
          typeof infoWindow.getPosition === 'function' &&
          typeof place.marker.getPosition === 'function'
        ) {
          try {
            if (
              infoWindow.getPosition() &&
              place.marker.getPosition() &&
              infoWindow.getPosition().equals(place.marker.getPosition())
            ) {
              infoWindow.close();
            }
          } catch (error) {
            // Silently handle any Google Maps API errors
          }
        }
      }
    });
  });

  // Function that will add place and marker to the places observable array
  function addPlace(place) {
    var marker = new markerService({
      map: map,
      position: {
        lng: place.location.coordinate.longitude,
        lat: place.location.coordinate.latitude
      },
      icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });

    marker.addListener(
      'click',
      function () {
        openMarker(place, marker);
      },
      false
    );
    place.marker = marker;
    place.show = ko.observable(true);
    self.places.push(place);
  }

  // Function that opens animates and opens a Google Maps marker
  function openMarker(place, marker) {
    map.setCenter(marker.getPosition());
    // marker.setAnimation(google.maps.Animation.BOUNCE);
    // setTimeout(function () {
    //   marker.setAnimation(null);
    // }, 700);
    placesHelper.getPlaceDetails(place, marker);
  }

  // Function that clears out places array
  self.clearPlaces = function () {
    var length = self.places().length;
    for (var i = 0; i < length; i++) {
      var removedPlace = self.places().shift();
      removedPlace.marker.setMap(null);
    }
    self.places.removeAll();
  };

  // Function that that will open a place's marker when clicked in list view
  self.getPlaceInfo = function (place) {
    // Close the menu if the screen is small
    if (window.innerWidth < 500 && !$('#menu').hasClass('menu-close')) {
      changeMenuState(place.marker.getPosition());
    }
    // Opens relevant marker
    openMarker(place, place.marker);
  };

  // Exposed view model function to call animateMenu
  self.toggleMenu = function () {
    var position = {
      lat: userPosition.coords.latitude,
      lng: userPosition.coords.longitude
    };
    changeMenuState(position);
  };

  // Animates the menu sidebar to open or close
  function changeMenuState(position) {
    var mapDiv = $('#map');
    var menu = $('#menu');
    mapDiv.toggleClass('map-close');
    menu.toggleClass('menu-close');
    // Resize map and pan back to center
    setTimeout(function () {
      var content = infoWindow.getContent();
      google.maps.event.trigger(map, 'resize');
      map.panTo(position);
      infoWindow.setContent(content);
    }, 500);
  }

  // Function to hold all Google Places API related functions
  function PlacesHelper() {
    // Function for getting additional information about place selected
    async function getPlaceDetails(place, marker) {
      // Open infoWindow for marker and pan map to the marker
      infoWindow.open(map, marker);
      infoWindow.setContent('Loading Place Details...');
      map.panTo(marker.getPosition());

      var request = {
        fields: ['displayName', 'nationalPhoneNumber', 'rating', 'websiteURI', 'photos', 'location']
      };

      const currentPlace = new placesService({
        id: place.place_id,
        requestedLanguage: 'en' // optional
      });

      try {
        const {place} = await currentPlace.fetchFields(request);

        const placeDetails = place.Dg;

        var photoUrl = '';
        if (placeDetails.photos && placeDetails.photos.length > 0) {
          photoUrl = `https://places.googleapis.com/v1/${placeDetails.photos[0].name}/media/?maxWidthPx=200&maxHeightPx=200&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`;
        }

        var content = `
                        <div class="place-container">
                            <div class="place-image">
                                ${
                                  photoUrl
                                    ? `<img src="${photoUrl}"/>`
                                    : '<div>No image available</div>'
                                }
                            </div>
                            <div class="place-info">
                                <p><strong>Name:</strong> ${placeDetails.displayName || 'N/A'}</p>
                                <p><strong>Phone:</strong> ${
                                  placeDetails.nationalPhoneNumber || 'N/A'
                                }</p>
                                <p><strong>Rating:</strong> ${placeDetails.rating || 'N/A'}</p>
                                ${
                                  placeDetails.websiteURI
                                    ? `<p><a href="${placeDetails.websiteURI}">Find Out More</a></p>`
                                    : ''
                                }
                            </div>
                        </div>
                    `;
        infoWindow.setContent(content);
      } catch (error) {
        handleError('Places service failed: ' + error);

        infoWindow.setContent('Error loading place details.');
      }
    }

    // Function for getting the list of places results based on search term
    async function getPlaces(term) {
      self.loadingPlaces(true);

      console.log(map);

      console.log(map.getBounds());
      console.log(map.getCenter());

      var request = {
        locationRestriction: map.getBounds(),
        textQuery: term,
        fields: [
          'displayName',
          'nationalPhoneNumber',
          'rating',
          'websiteURI',
          'photos',
          'location'
        ],
        language: 'en-US',
        maxResultCount: 8,
        minRating: 3.2
      };

      try {
        const {places} = await placesService.searchByText(request);

        // Clear out places array and add new places into it
        self.clearPlaces();

        // Limit to 10 results to match previous behavior
        var limitedResults = places.slice(0, 10).map(p => p.Dg);

        limitedResults.forEach(function (place) {
          // Convert Google Places format to match expected format
          var convertedPlace = {
            id: place.id,
            place_id: place.id,
            name: place.displayName,
            location: {
              coordinate: {
                latitude: place.location.lat,
                longitude: place.location.lng
              }
            }
          };
          addPlace(convertedPlace);
        });
      } catch (error) {
        handleError('Places search failed: ' + error);
      } finally {
        document.getElementById('places-loader').className += ' hidden';

        self.loadingPlaces(false);
      }
    }

    return {
      getPlaceDetails: getPlaceDetails,
      getPlaces: getPlaces
    };
  }
}

// //Init Map Callback once Google Maps API is downloaded
async function initMap() {
  'use strict';

  const {Map, InfoWindow} = await loader.importLibrary('maps');
  const {Place} = await loader.importLibrary('places');
  const {Marker} = await loader.importLibrary('marker');
  markerService = Marker;
  // Attempt to get users geolocation
  navigator.geolocation.getCurrentPosition(geoSuccess, geoError);

  // Successful callback when the users geolocation information can be accessed
  function geoSuccess(position) {
    //Initialize the map using the users location
    userPosition = position;

    console.log(userPosition);

    map = new Map(document.getElementById('map'), {
      center: {
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude
      },
      zoom: 12,
      mapTypeControl: false
    });
    infoWindow = new InfoWindow();
    placesService = Place;

    //Applying the bindings to the view model
    ko.applyBindings(new ViewModel('art gallery'));

    var mapLoader = document.getElementById('map-loader');
    if (mapLoader !== null) {
      document.getElementById('map-loader').className += ' hidden';
    }
  }

  // Error callback when user's geolocation cannot be accessed
  function geoError(error) {
    // Initialize the map using default location and places
    alert(
      'Showing search results for "art gallery" near default location of Washington DC because we could not access geolocation data'
    );
    map = new Map(document.getElementById('map'), {
      center: {
        lat: LAT,
        lng: LNG
      },
      zoom: 12,
      mapTypeControl: false
    });
    userPosition = {
      coords: {
        latitude: LAT,
        longitude: LNG
      }
    };
    infoWindow = new InfoWindow();
    placesService = Place;

    //Applying the bindings to the view model
    ko.applyBindings(new ViewModel('art gallery'));

    var mapLoader = document.getElementById('map-loader');
    if (mapLoader !== null) {
      document.getElementById('map-loader').className += ' hidden';
    }
  }
}

initMap();

// Error handler function which alerts user an error has occurred
var handleError = function (error) {
  console.error('Something has gone wrong. Please try refreshing the page. ', error);
};

// Global catch for all errors that may occur but don't get handled
window.onerror = function (error) {
  handleError(error);
};

function removePageLoader() {
  var pageLoader = document.getElementById('page-loader');
  document.body.removeChild(pageLoader);
}

if (
  document.readyState === 'complete' ||
  (document.readyState === 'loading' && !document.documentElement.doScroll)
) {
  removePageLoader();
} else {
  document.addEventListener('DOMContentLoaded', removePageLoader);
}
