var map = L.map('map').setView([51.2277411, 6.7734556], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

let routingPoints = [];
let pathPoints = [];
let checkpoints = [];
let route;
let control;

//Colorize Background of Color Select
$("#routeColorInput").on("change", (e) => {
    $("#routeColorInput").css("background-color", $("#routeColorInput").val());
});

map.on('click', function(e){
    createRoutingPoint(e);
});

/*
function calcRoute() {
    if (control != null) {
        map.removeControl(control);
        control = null;
        console.log(routingPoints);
    }

    if(routingPoints.length < 2) return;

    var routingPositions = [];
    for(let i = 0; i < routingPoints.length; i++)
    {
        routingPositions.push(routingPoints[i]._latlng);
    }
    control = L.Routing.control(L.extend({
        waypoints: routingPositions,
        geocoder: L.Control.Geocoder.nominatim(),
        router: new L.Routing.OpenRouteService('58d904a497c67e00015b45fc4f1ca5bb772b4a179eb9de97a5f03f5e', {profile: "foot-walking"}),
        routeWhileDragging: false,
        reverseWaypoints: true,
        showAlternatives: false,
        createMarker: () => {return null},
        lineOptions: {
            styles: [{color: $("#routeColorInput").val(),
            opacity: 1,
            weight: 5}]
        },
        routeLine: function (r) {
            var line = L.Routing.line(r);
            //console.log(line._route.coordinates);
            return line;
        }
    })).addTo(map);
}

 */


async function calcRoute() {

    pathPoints = [];
    if(routingPoints.length < 2) return;
    var coordString = "";
    for(let i = 0; i < routingPoints.length; i++)
    {
        pathPoints.push(routingPoints[i]._latlng);
        coordString += routingPoints[i]._latlng.lng + "," + routingPoints[i]._latlng.lat + "|";
    }
    coordString = coordString.slice(0, -1);
    console.log(coordString);
    var url = "https://api.openrouteservice.org/directions?coordinates=" + coordString + "&instructions=false&instructions_format=text&geometry_format=geojson&preference=shortest&units=m&profile=cycling-road&api_key=58d904a497c67e00015b45fc4f1ca5bb772b4a179eb9de97a5f03f5e";
    getRouting(url);
}

function getRouting(url) {
    console.log("Getting route!");
    $.ajax({
        type: "GET",
        url: url
    }).done(function(e) {
        console.log(e);
        drawRoute(e);
    });
}

function drawRoute(api) {
    checkpoints = [];
    if(route != null)
    {
        map.removeLayer(route);
    }
    let routePoints = api.routes[0].geometry.coordinates;
    let points = routePoints.map((e) => {return {lat: e[1], lng: e[0]}});
    route = new L.Polyline(points, {
        color: "blue",
        weight: 6,
        opacity: 0.8,
        smoothFactor: 2
    });
    route.addTo(map);
    checkpoints = points;
}


function createRoutingPoint(e, calc = true)
{
    var marker = new L.marker(e.latlng, {draggable: true}).addTo(map);
    routingPoints.push(marker);
    marker.on('click', function() {
        console.log("Click");
        deleteRoutingPoint(marker);
        calcRoute();
    });
    marker.on('dragend', function() {
        console.log("Dragend");
        calcRoute();
    });

    if (calc) calcRoute();


}
function deleteRoutingPoint(marker) {
    let markerPos = routingPoints.indexOf(marker);
    routingPoints.splice(markerPos, 1);
    map.removeLayer(marker);
    if(route != null)
    {
        map.removeLayer(route);
    }
    calcRoute();
}

//Create POI Marker on Map
//Create new Inputs in Route editor
function addPoi(name = undefined, description = undefined, location = undefined) {
    if(name == undefined && description == undefined && location == undefined)
    {
        var marker = L.marker(map.getCenter(), {icon: blackIcon, draggable: true}).addTo(map);
        var content = "<span class='poi'>POI Name:<input placeholder='POI Name' class='poiName'>POI Beschreibung:<input placeholder='POI Beschreibung' class='poiDescription'></span>";
    }
    else
    {
        var marker = L.marker(location, {icon: blackIcon, draggable: true}).addTo(map);
        var content = "<span class='poi'>POI Name:<input placeholder='POI Name' class='poiName' value='" + name + "'>POI Beschreibung:<input placeholder='POI Beschreibung' class='poiDescription' value='" + description + "'></span>";
    }
    content = $(content).appendTo("#pois");
    $(content).attr("lat", marker.getLatLng().lat);
    $(content).attr("lng", marker.getLatLng().lng);
    marker.on("dragend", (e) => {
        var marker = e.target;
        $(content).attr("lat", marker.getLatLng().lat);
        $(content).attr("lng", marker.getLatLng().lng);
    });
}

function removePoi(poiId) {
    
}

function isValid(value) {
    if(value != undefined && value != "")
    {
        //return value.replace(/.|_|<|>|$|&/g, "");
        return true;
    }
    return false;
}

function saveRoute() {
    console.log("Saving Route!");
    let title = $("#routeTitleInput").val();
    let description = $("#routeDescriptionInput").val();
    let descriptionEnd = $("#routeDescriptionEndInput").val();
    let color = $("#routeColorInput").val();
    let pois = [];
    let routingPoints = pathPoints;

    if(isValid(title) && isValid(description) && isValid(color))
    {
        $("#pois").find(".poi").each((e, t) => {
            var poi = $(t);
            console.log(poi);
            var name = poi.find(".poiName:eq(0)").val();
            console.log(name);
            var description = poi.find(".poiDescription:eq(0)").val();
            var latlng = {lat: poi.attr("lat"), lng: poi.attr("lng")};
            //console.log(latlng);
            pois.push({latlng: latlng, title: name, description: description});
        });
    }

    var data = {name: title, description: description, descriptionEnd: descriptionEnd, color: color, pois: pois, routingpoints: routingPoints, checkpoints: checkpoints};
    //console.log(data);

    /*
    $.ajax({
        type: "POST",
        url: "/api/create/route",
        data: data,
        success: () => {console.log("Success")},
        error: (e) => {console.log(e)}
    });
     */

    // 1. Create a new XMLHttpRequest object
    let xhr = new XMLHttpRequest();

    // 2. Configure it: GET-request for the URL /article/.../load
        xhr.open('POST', '/api/create/route/');

    // 3. Send the request over the network
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send("route=" + JSON.stringify(data));

}