var map;
var userPosition;
var infoWindow;
var service;
var searched = false;

var viewModel = {
    filter: ko.observable(""),
    status: ko.observable(""),
    places: ko.observableArray([])
};

viewModel.filter.subscribe(function(newValue) {
    console.log(newValue);
    filterPlaces(newValue);
});

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

ko.applyBindings(viewModel);

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
        zoom: 12
    });
    finishInit();
};

function geoError(error) {
    console.log("Geolocation Error: " + error.code);
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 38.9072,
            lng: -77.0369
        },
        zoom: 12
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
        setTimeout(function(){
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
