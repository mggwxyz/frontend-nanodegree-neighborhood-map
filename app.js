//Geolocation
function initMap() {
    var map;
    var userPosition;
    var geoSuccess = function(position) {
        userPosition = position;
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: userPosition.coords.latitude,
                lng: userPosition.coords.longitude
            },
            zoom: 8
        });
    };
    var geoError = function(error){
        console.log("Geolocation Error: " + error.code);
    };
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);

}
