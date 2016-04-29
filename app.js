//Global variables
var map;
var userPosition;
var infoWindow;
var service;
var searched = false;
var LAT = 38.9072;
var LNG = -77.0369;

//KO Simple View Model
var viewModel = {
    filter: ko.observable(""),
    status: ko.observable(""),
    places: ko.observableArray([])
};

//KO Subscription that watches the filter observable and filters places from list
viewModel.filter.subscribe(function(newValue) {
    filterPlaces(newValue);
});

//Function that removes places from list and map base on filter entered
function filterPlaces(value) {
    var regex = new RegExp(value, "i");
    viewModel.places().forEach(function(place) {
        if (place.name.search(regex) == -1) {
            place.show(false);
            place.marker.setVisible(false);
        } else {
            place.show(true);
            place.marker.setVisible(true);
        }
    });
}

//Applying the bindings to the view model
ko.applyBindings(viewModel);

//Init Map function
function initMap() {
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
}

function geoSuccess(position) {
    userPosition = position;
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: userPosition.coords.latitude,
            lng: userPosition.coords.longitude
        },
        zoom: 12
    });
    finishInit();
};

function geoError(error) {
    console.log("Geolocation Error: " + error.code);
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: LAT,
            lng: LNG
        },
        zoom: 12,
        mapTypeControl: false
    });
    finishInit();
};

function finishInit() {
    console.log("finishInit called...");
    infoWindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);
    map.addListener('idle', performRadarSearch);
};

function performRadarSearch() {
    if (!searched) {
        console.log("performRadarSearch called...");
        var req = {
            bounds: map.getBounds(),
            keyword: 'art',
            types: ['art_gallery']
        };
        searched = true;
        service.radarSearch(req, radarSearchCallBack);
    } else {
        //do nothing;
    }
}

function radarSearchCallBack(results, status) {
    console.log("radarSearchCallBack called...");
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
    }
    for (var i = 0; i < 10; i++) {
        addMarker(results[i]);
    }
}

function addMarker(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: {
            url: 'http://maps.gstatic.com/mapfiles/circle.png',
            anchor: new google.maps.Point(10, 10),
            scaledSize: new google.maps.Size(10, 17)
        }
    });
    service.getDetails(place, function(result, status) {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
            console.error(status);
            return;
        } else {
            result.marker = marker;
            result.show = ko.observable(true);
            viewModel.places.push(result);
        }
    });

    google.maps.event.addListener(marker, 'click', function() {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 700);
        service.getDetails(place, function(result, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                console.error(status);
                return;
            }
            infoWindow.setContent(result.name);
            infoWindow.open(map, marker);
        });
    });
}

function getYelpPlaces() {

    var YELP_KEY = "pV7R7vzUXJEFfl3Dj4retQ",
        YELP_TOKEN = "VDFoUxGRIq2274OdKt8U-wwvpgnkKtrL",
        YELP_KEY_SECRET = "t4CQ3YyzkgP26-lDGp1pVoLOFks",
        YELP_TOKEN_SECRET = "SB5H01fW3LCNi3qyO7uaJ59DK9U";

    var yelp_url = 'https://api.yelp.com/v2/search';

    function nonce_generate() {
        return (Math.floor(Math.random() * 1e12).toString());
    }

    var parameters = {
        oauth_consumer_key: YELP_KEY,
        oauth_token: YELP_TOKEN,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version: '1.0',
        callback: 'cb',
        term: 'art',
        category_filter: 'galleries',
        location: 'Washington, DC',
        cll : LAT + ',' + LNG
    };

    var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
    parameters.oauth_signature = encodedSignature;

    var settings = {
        url: yelp_url,
        data: parameters,
        cache: true,
        dataType: 'jsonp',
        success: function(result){
            console.log("Success: " + result);
            console.log(result);
        },
        error: function(result) {
            console.log("Error: " + result);
        }
    };

    // Send AJAX query via jQuery library.
    $.ajax(settings);
}



function toggleMenu() {
    var logo = document.getElementById("logo");
    var menu = document.getElementById("menu");
    if (logo.className === "logo logo-open") {
        logo.className = "logo logo-close";
        menu.className = "menu-close";
    } else {
        logo.className = "logo logo-open";
        menu.className = "menu-open";
    }
}
