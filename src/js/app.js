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
    var yelpHelper = new YelpHelper(); // Object is used for ajax calls to Yelp API
    var initialized = false; // Variable to tell if the map has initialized or not
    var dflt = useDefaultPlaces; // Variable indicating whether to use default places

    // Initialize Knockout observables
    self.searchText = ko.observable(searchText); // Observable for search input text
    self.filterText = ko.observable(''); // Observable for filter input text
    self.places = ko.observableArray([]); // Obserable Array for all places in list

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
                yelpHelper.getYelpPlaces(self.searchText().trim());
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
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
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
        yelpHelper.getYelpPlace(place.id, marker);
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

    // Function to hold all yelp api relatated functions
    function YelpHelper(){

        // Local Variables Need for API Calls
        var xhr;
        var YELP_KEY = 'pV7R7vzUXJEFfl3Dj4retQ',
            YELP_TOKEN = 'VDFoUxGRIq2274OdKt8U-wwvpgnkKtrL',
            YELP_KEY_SECRET = 't4CQ3YyzkgP26-lDGp1pVoLOFks',
            YELP_TOKEN_SECRET = 'SB5H01fW3LCNi3qyO7uaJ59DK9U';

        // Generates random string
        function nonce_generate() {
            return (Math.floor(Math.random() * 1e12).toString());
        }

        // Function for getting additional information about place selected
        function getYelpPlace(placeId, marker) {
            // Declare local variables
            var yelp_url = 'https://api.yelp.com/v2/business/' + placeId;  // Yelp business search url
            // Parameters required for oauth yelp api request
            var parameters = {
                oauth_consumer_key: YELP_KEY,
                oauth_token: YELP_TOKEN,
                oauth_nonce: nonce_generate(),
                oauth_timestamp: Math.floor(Date.now() / 1000),
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                callback: 'cb',
            };
            // Add encoded oauth signature to ajax parameters
            var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
            parameters.oauth_signature = encodedSignature;

            // Open infoWindow for marker and pan map to the marker
            infoWindow.open(map, marker);
            infoWindow.setContent('Loading Yelp Data...');
            map.panTo(marker.getPosition());

            // Send AJAX query via jQuery library.
            $.ajax({
                url: yelp_url,
                data: parameters,
                cache: true,
                dataType: 'jsonp'
            }).done(function(result) { // Success callback
                // Set infoWindow content for marker that was click to display yelp info
                var content = '<div class="place-container"><div class="place-image">' +
                    (result.image_url !== undefined ? '<img src="' + result.image_url + '"/>' : '<div>No image available</div>') +
                    '</div><div class="place-info">' +
                    '<p><strong>Name:</strong> ' + (result.name !== undefined ? result.name : 'N/A') + '</p>' +
                    '<p><strong>Phone:</strong> ' + (result.display_phone !== undefined ? result.display_phone : 'N/A') + '</p>' +
                    '<p><strong>Rating:</strong> ' + (result.rating !== undefined ? result.rating : 'N/A') + '</p>' +
                    (result.url !== undefined ? '<p><a href="' + result.url + '">Find Out More</a></p>': '') +
                    '</div></div>';
                infoWindow.setContent(content);
            }).fail(function(jqXHR, textStatus){ // Error callback
                // Handle error and indicate in infoWindow that an error occurred loading the data
                handleError();
                infoWindow.setContent('Error loading data.');
            });
        }

        // Function for getting the list of yelp results based on search term
        function getYelpPlaces(term) {
            // Check to see if the current ajax request is in progress. If it is, abort
            if(xhr && xhr.readyState != 4){
                xhr.abort();
            }
            // Declare local variables
            var center = map.getCenter(); // Get map center to pass coordinates to query
            var yelp_url = 'https://api.yelp.com/v2/search'; // Yelp general search url
            var parameters = { // Parameter required for oauth yelp api request
                oauth_consumer_key: YELP_KEY,
                oauth_token: YELP_TOKEN,
                oauth_nonce: nonce_generate(),
                oauth_timestamp: Math.floor(Date.now() / 1000),
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                callback: 'cb',
                limit: 10,
                term: term,
                ll: center.lat() + ',' + center.lng()
            };
            // Add encoded oauth signature to ajax parameters
            var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
            parameters.oauth_signature = encodedSignature;
            // Send AJAX query via jQuery library
            xhr = $.ajax({
                url: yelp_url,
                data: parameters,
                cache: true,
                dataType: 'jsonp'
            }).done(function(result) { // Successful callback
                // If successful, clear out places array and add new places into it
                self.clearPlaces();
                result.businesses.forEach(function(place){
                    addPlace(place);
                });
            }).fail(function(jqXHR, textStatus) { // Error callback
                // Handle error, but ignore aborted requests, because we most likely aborted that request
                if(textStatus !== 'abort'){
                    handleError();
                }
            });
        }

        return {
            getYelpPlace : getYelpPlace,
            getYelpPlaces : getYelpPlaces
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
    }
};

// Error handler function which alerts user an error has occurred
var handleError = function(){
    alert('Something has gone wrong. Please try refreshing the page.');
};

// Global catch for all errors that may occur but don't get handled
window.onerror = function(){
    handleError();
};
