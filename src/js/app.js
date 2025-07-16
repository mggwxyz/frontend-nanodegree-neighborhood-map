/*jslint browser: true */
/*global window: false */

// Global variables
var google, map, userPosition, infoWindow,
    LAT = 38.9072,
    LNG = -77.0369;

// Hard-Coded Destinations
var defaultPlaces = [{
    id: 'national-gallery-of-art-washington',
    name: 'National Gallery of Art',
    location: {
        coordinate : {
            latitude: 38.8913416579172,
            longitude: -77.0198351875512
        }
    }
}, {
    id: 'hirshhorn-museum-and-sculpture-garden-washington-2',
    name: 'Hirshhorn Museum & Sculpture Garden',
    location: {
        coordinate : {
            latitude: 38.8875699,
            longitude: -77.02191
        }
    }
}, {
    id: 'bloombars-washington',
    name: 'BloomBars',
    location: {
        coordinate : {
            latitude: 38.930202,
            longitude: -77.028114
        }
    }
}, {
    id: 'freer-gallery-of-art-and-arthur-m-sackler-gallery-washington',
    name: 'Freer Gallery of Art and Arthur M Sackler Gallery',
    location: {
        coordinate : {
            latitude: 38.8875252753496,
            longitude: -77.0265506207943
        }
    }
}, {
    id: 'the-fridge-washington',
    name: 'The Fridge',
    location: {
        coordinate : {
            latitude: 38.88213,
            longitude: -76.994232
        }
    }
}, {
    id: 'national-gallery-of-art-sculpture-garden-washington-2',
    name: 'National Gallery of Art Sculpture Garden',
    location: {
        coordinate : {
            latitude: 38.8912975692515,
            longitude: -77.022959356414
        }
    }
}, {
    id: 'toro-mata-washington',
    name: 'Toro Mata',
    location: {
        coordinate : {
            latitude: 38.92099,
            longitude: -77.04238
        }
    }
}, {
    id: 'the-smithsonian-institution-washington',
    name: 'The Smithsonian Institution',
    location: {
        coordinate : {
            latitude: 38.8889236,
            longitude: -77.0261612
        }
    }
}, {
    id: 'artists-proof-washington-2',
    name: 'Artist\'s Proof',
    location: {
        coordinate : {
            latitude: 38.910091,
            longitude: -77.064407
        }
    }
}, {
    id: 'the-phillips-collection-washington-3',
    name: 'The Phillips Collection',
    location: {
        coordinate : {
            latitude: 38.911477119043,
            longitude: -77.0468060633715
        }
    }
}];

// Knockout ViewModel
function ViewModel(searchText, useDefaultPlaces ) {
    'use strict';

    //Initialize local variables for ViewModel
    var self = this; // Variable self refers to ViewModel to clear up 'this' confusion
    var placesHelper = new PlacesHelper(); // Object is used for ajax calls to Places API
    var initialized = false; // Variable to tell if the map has initialized or not
    var dflt = useDefaultPlaces; // Variable indicating whether to use default places

    // Initialize Knockout observables
    self.searchText = ko.observable(searchText); // Observable for search input text
    self.filterText = ko.observable(''); // Observable for filter input text
    self.places = ko.observableArray([]); // Obserable Array for all places in list
    self.loadingPlaces = ko.observable(true);

    // KO computed observable that watches changes to the search observable and qeuries yelp for relevant places
    self.search = ko.computed(function() {
        // Only search if search text is not empty
        if (self.searchText().trim() !== '') {
            // Only
            if(self.searchText().trim() === 'art gallery' && dflt && !initialized ){
                var i;
                for(i = 0; i < defaultPlaces.length ; i++){
                    addPlace(defaultPlaces[i]);
                }
                initialized = true;
            } else {
                placesHelper.getPlaces(self.searchText().trim());
            }
        // Otherwise clear out the list if there is no search text
        } else {
            self.clearPlaces();
        }
    });

    /*
     * KO computed observable that watches changes to the filter observable then
     * removes places from list and map base on filter entered
     */
    self.filter = ko.computed(function(){
        var regex = new RegExp(self.filterText(), 'i');
        self.places().forEach(function(place) {
            if (place.name.search(regex) == -1) {
                // Close open infowindow if the place is being filtered
                if( infoWindow.getPosition() === place.marker.getPosition()){
                    infoWindow.close();
                }
                place.show(false);
                place.marker.setVisible(false);
            } else {
                place.show(true);
                place.marker.setVisible(true);
            }
        });
    });

    // Function that will add place and marker to the places observable array
    function addPlace(place){
        var marker = new google.maps.Marker({
            map: map,
            position: {
                lng: place.location.coordinate.longitude,
                lat: place.location.coordinate.latitude
            },
            icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });

        marker.addListener('click', function(){openMarker(place, marker);}, false);
        place.marker = marker;
        place.show = ko.observable(true);
        self.places.push(place);
    }

    // Function that opens animates and opens a Google Maps marker
    function openMarker(place, marker) {
        map.setCenter(marker.getPosition());
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 700);
        placesHelper.getPlaceDetails(place, marker);
    }

    // Function that clears out places array
    self.clearPlaces = function(){
        var length = self.places().length;
        for(var i = 0; i < length; i++ ){
            var removedPlace = self.places().shift();
            removedPlace.marker.setMap(null);
        }
        self.places.removeAll();
    };

    // Function that that will open a place's marker when clicked in list view
    self.getYelpInfo = function(place){
        // Close the menu if the screen is small
        if(window.innerWidth < 500 && !$('#menu').hasClass('menu-close')){
            changeMenuState(place.marker.getPosition());
        }
        // Opens relevant marker
        openMarker(place, place.marker);
    };

    // Exposed view model function to call animateMenu
    self.toggleMenu = function(){
        var position = {
            lat: userPosition.coords.latitude,
            lng: userPosition.coords.longitude
        };
        changeMenuState(position);
    };

    // Animates the menu sidebar to open or close
    function changeMenuState(position){
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

    // Function to hold all places api related functions
    function PlacesHelper(){

        // Local Variables Need for API Calls
        var xhr;
        var placesService;

        // Function for getting additional information about place selected
        function getPlaceDetails(place, marker) {
            // Open infoWindow for marker and pan map to the marker
            infoWindow.open(map, marker);
            infoWindow.setContent('Loading Place Details...');
            map.panTo(marker.getPosition());

            // If we have a Google place_id, use Places service for details
            if (place.place_id && placesService) {
                var request = {
                    placeId: place.place_id,
                    fields: ['name', 'rating', 'formatted_phone_number', 'photos', 'website', 'reviews']
                };

                placesService.getDetails(request, function(placeDetails, status) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        var photoUrl = '';
                        if (placeDetails.photos && placeDetails.photos.length > 0) {
                            photoUrl = placeDetails.photos[0].getUrl({maxWidth: 300});
                        }

                        var content = '<div class="place-container"><div class="place-image">' +
                            (photoUrl ? '<img src="' + photoUrl + '" style="width:100%;max-width:300px;"/>' : '<div>No image available</div>') +
                            '</div><div class="place-info">' +
                            '<p><strong>Name:</strong> ' + (placeDetails.name || place.name || 'N/A') + '</p>' +
                            '<p><strong>Phone:</strong> ' + (placeDetails.formatted_phone_number || 'N/A') + '</p>' +
                            '<p><strong>Rating:</strong> ' + (placeDetails.rating || 'N/A') + '</p>' +
                            (placeDetails.website ? '<p><a href="' + placeDetails.website + '" target="_blank">Visit Website</a></p>' : '') +
                            '</div></div>';
                        infoWindow.setContent(content);
                    } else {
                        showBasicPlaceInfo(place, marker);
                    }
                });
            } else {
                // Fallback to basic place information
                showBasicPlaceInfo(place, marker);
            }
        }

        // Function to show basic place information when detailed data isn't available
        function showBasicPlaceInfo(place, marker) {
            var content = '<div class="place-container"><div class="place-info">' +
                '<p><strong>Name:</strong> ' + (place.name || 'N/A') + '</p>' +
                '<p><strong>Type:</strong> Art Gallery & Museum</p>' +
                '<p>This is a featured location in the Washington DC area.</p>' +
                '</div></div>';
            infoWindow.setContent(content);
        }

        // Function for getting the list of places based on search term
        function getPlaces(term) {
            self.loadingPlaces(true);

            // Initialize Places service if not already done
            if (!placesService) {
                placesService = new google.maps.places.PlacesService(map);
            }

            // Get map center for search location
            var center = map.getCenter();
            
            // Clear existing places first
            self.clearPlaces();

            // Create request for nearby search
            var request = {
                location: center,
                radius: 10000, // 10km radius
                keyword: term,
                type: ['museum', 'art_gallery', 'tourist_attraction']
            };

            // Search for places using Google Places API
            placesService.nearbySearch(request, function(results, status) {
                document.getElementById("places-loader").className += ' hidden';
                self.loadingPlaces(false);

                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    // Process the results and add places to the map
                    results.slice(0, 10).forEach(function(place) { // Limit to 10 results
                        var formattedPlace = {
                            id: place.place_id,
                            name: place.name,
                            place_id: place.place_id,
                            location: {
                                coordinate: {
                                    latitude: place.geometry.location.lat(),
                                    longitude: place.geometry.location.lng()
                                }
                            },
                            rating: place.rating,
                            types: place.types
                        };
                        addPlace(formattedPlace);
                    });
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    // No results found, show default places if searching for art gallery
                    if (term.toLowerCase().includes('art') || term.toLowerCase().includes('gallery')) {
                        var i;
                        for(i = 0; i < defaultPlaces.length; i++){
                            addPlace(defaultPlaces[i]);
                        }
                    }
                } else {
                    console.warn('Places search failed with status:', status);
                    // Fallback to default places
                    if (term.toLowerCase().includes('art') || term.toLowerCase().includes('gallery')) {
                        var i;
                        for(i = 0; i < defaultPlaces.length; i++){
                            addPlace(defaultPlaces[i]);
                        }
                    }
                }
            });
        }

        return {
            getPlaceDetails : getPlaceDetails,
            getPlaces : getPlaces
        };
    }
}

//Init Map Callback once Google Maps API is downloaded
var initMap = function() {
    'use strict';

    // Attempt to get users geolocation
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);

    // Successful callback when the users geolocation information can be accessed
    function geoSuccess(position) {
        //Initialize the map using the users location
        userPosition = position;
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: userPosition.coords.latitude,
                lng: userPosition.coords.longitude
            },
            zoom: 12,
            mapTypeControl: false
        });
        infoWindow = new google.maps.InfoWindow();

        //Applying the bindings to the view model
        ko.applyBindings(new ViewModel('art gallery', false));

        var mapLoader = document.getElementById("map-loader");
        if ( mapLoader !== null ) {
            document.getElementById("map-loader").className += ' hidden';
        }
    }

    // Error callback when user's geolocation cannot be accessed
    function geoError(error) {
        // Initialize the map using default location and places
        alert('Showing search results for "art gallery" near default location of Washington DC because we could not access geolocation data');
        map = new google.maps.Map(document.getElementById('map'), {
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
        infoWindow = new google.maps.InfoWindow();

        //Applying the bindings to the view model
        ko.applyBindings(new ViewModel('art gallery', true));

        var mapLoader = document.getElementById("map-loader");
        if ( mapLoader !== null ) {
            document.getElementById("map-loader").className += ' hidden';
        }
    }

};

// Error handler function which alerts user an error has occurred
var handleError = function(error){
    console.log('Something has gone wrong. Please try refreshing the page. ',  error);
};

// Global catch for all errors that may occur but don't get handled
window.onerror = function(error){
    handleError(error);
};

function removePageLoader(){
   var pageLoader =  document.getElementById('page-loader');
   document.body.removeChild(pageLoader);
}

if ( document.readyState === 'complete' || (document.readyState === 'loading' && !document.documentElement.doScroll )) {
    removePageLoader();
} else {
    document.addEventListener('DOMContentLoaded', removePageLoader );
}
