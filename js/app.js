/*jslint browser: true */
/*global window: false */

//Global variables
var google, map, userPosition, infoWindow, yelpHelper;
var LAT = 38.9072,
    LNG = -77.0369;

//Hard-Coded Destinations
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

//KO Simple View Model
function ViewModel(searchText, useDefaultPlaces ) {
    'use strict';

    var self = this;
    var yelpHelper = new YelpHelper();
    var initialized = false;
    var dflt = useDefaultPlaces;
    self.searchText = ko.observable(searchText);
    self.filterText = ko.observable('');
    self.places = ko.observableArray([]);

    //KO Subscription that watches the search observable and searches places for list
    self.search = ko.computed(function() {
        if (self.searchText().trim() !== '') {
            if(self.searchText().trim() === 'art gallery' && dflt && !initialized ){
                var i;
                for(i = 0; i < defaultPlaces.length ; i++){
                    addPlace(defaultPlaces[i]);
                }
                initialized = true;
            } else {
                yelpHelper.getYelpPlaces(self.searchText().trim());
            }
        } else {
            self.clearPlaces();
        }
    });

    //Function that removes places from list and map base on filter entered
    self.filter = ko.computed(function(){
        var regex = new RegExp(self.filterText(), 'i');
        self.places().forEach(function(place) {
            if (place.name.search(regex) == -1) {
                place.show(false);
                place.marker.setVisible(false);
            } else {
                place.show(true);
                place.marker.setVisible(true);
            }
        });
    });

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

    function openMarker(place, marker) {
        map.setCenter(marker.getPosition());
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 700);
        yelpHelper.getYelpPlace(place.id, marker);
    }

    // Clear out places from list view
    self.clearPlaces = function(){
        var length = self.places().length;
        for(var i = 0; i < length; i++ ){
            var removedPlace = self.places().shift();
            removedPlace.marker.setMap(null);
        }
        self.places.removeAll();
    };

    self.getYelpInfo = function(place){
        //check to see if screen is small and menu is open
        if(window.innerWidth < 500 && !$('#menu').hasClass('menu-close')){
            self.toggleMenu();
        }
        openMarker(place, place.marker);
    };

    // Toggles the menu sidebar to open or close
    self.toggleMenu = function(){
        var mapDiv = $('#map');
        var menu = $('#menu');
        mapDiv.toggleClass('map-close');
        menu.toggleClass('menu-close');
        //Resize map and pan back to center
        setTimeout(function () {
            var content = infoWindow.getContent();
            google.maps.event.trigger(map, 'resize');
            map.panTo({lat: userPosition.coords.latitude, lng: userPosition.coords.longitude});
            infoWindow.setContent(content);
        }, 500);
    };

    // Function to hold all yelp api relatated functions
    function YelpHelper(){

        //Local Variables Need for API Calls
        var xhr;
        var YELP_KEY = 'pV7R7vzUXJEFfl3Dj4retQ',
            YELP_TOKEN = 'VDFoUxGRIq2274OdKt8U-wwvpgnkKtrL',
            YELP_KEY_SECRET = 't4CQ3YyzkgP26-lDGp1pVoLOFks',
            YELP_TOKEN_SECRET = 'SB5H01fW3LCNi3qyO7uaJ59DK9U';

        function nonce_generate() {
            return (Math.floor(Math.random() * 1e12).toString());
        }

        function getYelpPlace(placeId, marker) {
            var yelp_url = 'https://api.yelp.com/v2/business/' + placeId;
            var parameters = {
                oauth_consumer_key: YELP_KEY,
                oauth_token: YELP_TOKEN,
                oauth_nonce: nonce_generate(),
                oauth_timestamp: Math.floor(Date.now() / 1000),
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                callback: 'cb',
            };
            var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
            parameters.oauth_signature = encodedSignature;

            infoWindow.open(map, marker);
            infoWindow.setContent('Loading Yelp Data...');
            map.panTo(marker.getPosition());

            // Send AJAX query via jQuery library.
            $.ajax({
                url: yelp_url,
                data: parameters,
                cache: true,
                dataType: 'jsonp'
            }).done(function(result) {
                var content = '<div class="place-container"><div class="place-image">' +
                    (result.image_url !== undefined ? '<img src="' + result.image_url + '"/>' : '<div>No image available</div>') +
                    '</div><div class="place-info">' +
                    '<p><strong>Name:</strong> ' + (result.name !== undefined ? result.name : 'N/A') + '</p>' +
                    '<p><strong>Phone:</strong> ' + (result.display_phone !== undefined ? result.display_phone : 'N/A') + '</p>' +
                    '<p><strong>Rating:</strong> ' + (result.rating !== undefined ? result.rating : 'N/A') + '</p>' +
                    (result.url !== undefined ? '<p><a href="' + result.url + '">Find Out More</a></p>': '') +
                    '</div></div>';
                infoWindow.setContent(content);
            }).fail(function(jqXHR, textStatus){
                handleError();
                infoWindow.setContent('Error loading data.');
            });
        }


        function getYelpPlaces(term) {
            console.log("get yelp places");
            if(xhr && xhr.readyState != 4){
                xhr.abort();
            }

            var center = map.getCenter();

            var yelp_url = 'https://api.yelp.com/v2/search';

            var parameters = {
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

            var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
            parameters.oauth_signature = encodedSignature;

            // Send AJAX query via jQuery library.
            xhr = $.ajax({
                url: yelp_url,
                data: parameters,
                cache: true,
                dataType: 'jsonp'
            }).done(function(result) {
                self.clearPlaces();
                result.businesses.forEach(function(place){
                    addPlace(place);
                });
            }).fail(function(jqXHR, textStatus) {
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

//Init Map Callback once Google Maps API is downloadeed
var initMap = function() {
    'use strict';

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);

    function geoSuccess(position) {
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

    function geoError(error) {
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



var handleError = function(){
    alert('Something has gone wrong. Please try refreshing the page.');
};

window.onerror = function(){
    handleError();
};
