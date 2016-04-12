var map;
var userPosition;
var infoWindow;
var service;

//Geolocation
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
        zoom: 8
    });
    finishInit();
};

function geoError(error) {
    console.log("Geolocation Error: " + error.code);
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 50.00,
            long: 50.00
        },
        zoom: 8
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
    console.log("performRadarSearch called...");
    var req = {
        bounds: map.getBounds(),
        keyword: 'best music'
    };

    service.radarSearch(req, radarSearchCallBack);
}

function radarSearchCallBack(results, status) {
    console.log("radarSearchCallBack called...");
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
    }
    for (var i = 0, result; result = results[i]; i++) {
        addMarker(result);
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

    google.maps.event.addListener(marker, 'click', function() {
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
