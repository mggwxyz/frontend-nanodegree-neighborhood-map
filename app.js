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
    self.useDefaultPlaces = ko.observable(useDefaultPlaces);
    self.searchText = ko.observable(searchText);
    self.filterText = ko.observable('');
    self.places = ko.observableArray([]);

    //KO Subscription that watches the search observable and searches places for list
    self.search = ko.computed(function() {
        if (self.searchText().trim() !== '') {
            yelpHelper.getYelpPlaces(self.searchText().trim());
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

    self.addPlace = ko.computed({
        read: function(){
            return '';
        },
        write: function(place) {
            var marker = new google.maps.Marker({
                map: map,
                position: {
                    lng: place.location.coordinate.longitude,
                    lat: place.location.coordinate.latitude
                },
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            });

            marker.addListener('click', openMarker);
            place.marker = marker;
            place.show = ko.observable(true);
            self.places.push(place);

            function openMarker() {
                map.setCenter(marker.getPosition());
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                    marker.setAnimation(null);
                }, 700);
                yelpHelper.getYelpPlace(place.id, marker);
            }
        }
    });

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
        if(Window.innerWidth < 500 && !$('#menu').hasClass('menu-close')){
            self.toggleMenu();
        }
        yelpHelper.getYelpPlace(place.id, place.marker);
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
            var settings = {
                url: yelp_url,
                data: parameters,
                cache: true,
                dataType: 'jsonp',
                success: function(result) {
                    var node = document.createElement('DIV');
                    node.innerHTML = '<div class="place-container"><div class="place-image">' +
                        '<img src="' + result.image_url + '"/>' +
                        '</div><div class="place-info">' +
                        '<p><strong>Name:</strong> ' + result.name + '</p>' +
                        '<p><strong>Phone:</strong> ' + result.display_phone + '</p>' +
                        '<p><strong>Rating:</strong> ' + result.rating + '</p>' +
                        '<p><a href="' + result.url + '">Find Out More</a></p>' +
                        '</div></div>';
                    infoWindow.setContent(node);
                },
                error: function(result) {
                    console.log('Error: ' + result);
                    infoWindow.setContent('Error loading data.');

                }
            };
            infoWindow.open(map, marker);
            infoWindow.setContent('Loading Yelp Data...');
            map.panTo(marker.getPosition());
            // Send AJAX query via jQuery library.
            $.ajax(settings);
        }


        function getYelpPlaces(term) {
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

            var settings = {
                url: yelp_url,
                data: parameters,
                cache: true,
                dataType: 'jsonp',
                success: function(result) {
                    self.clearPlaces();
                    result.businesses.forEach(function(place){
                        self.addPlace(place);
                    });
                },
                error: function(result) {
                    console.log('Error: ' + result);
                }
            };

            // Send AJAX query via jQuery library.
            xhr = $.ajax(settings);
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
        console.log('Geolocation Error: ' + error.code);
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
