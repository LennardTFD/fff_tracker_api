var map = L.map('map').setView([51.2277411, 6.7734556], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

let routingPoints = [];
let pathPoints = [];
let checkpoints = [];
let route;
let control;
let poiMarkers = {};

let colors = ["red", "green", "blue", "violet", "grey", "black", "yellow", "orange"];

//Colorize Background of Color Select
$("#routeColorInput").on("change", (e) => {
    $("#routeColorInput").css("background-color", $("#routeColorInput").val());
});

map.on('click', function(e){
    createRoutingPoint(e);
});




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
    let id = (new Date()).getTime();
    if(name == undefined && description == undefined && location == undefined)
    {
        var marker = L.marker(map.getCenter(), {icon: blackIcon, draggable: true}).addTo(map);
        var content = "<span id='" + id + "' class='poi'><a style='font-weight: bold' href='#' onclick='findPoi($(this).parent())'>POI Name:</a><input placeholder='POI Name' class='poiName'><p>POI Beschreibung:</p><input placeholder='POI Beschreibung' class='poiDescription'><br><input type='button' onclick='removePoi(" + id + ")' value='Entfernen'><hr></span>";
    }
    else
    {
        var marker = L.marker(location, {icon: blackIcon, draggable: true}).addTo(map);
        var content = "<span id='" + id + "' class='poi'><a style='font-weight: bold' href='#' onclick='findPoi($(this).parent())'>POI Name:</a><input placeholder='POI Name' class='poiName' value='" + name + "'><p>POI Beschreibung:</p><input placeholder='POI Beschreibung' class='poiDescription' value='" + description + "'><br><input type='button' onclick='removePoi(" + id + ")' value='Entfernen'><hr></span>";
    }
    content = $(content).appendTo("#pois");
    $(content).attr("lat", marker.getLatLng().lat);
    $(content).attr("lng", marker.getLatLng().lng);
    marker.on("dragend", (e) => {
        var marker = e.target;
        $(content).attr("lat", marker.getLatLng().lat);
        $(content).attr("lng", marker.getLatLng().lng);
    });

    poiMarkers[id] = marker;
}

function removePoi(poiId) {
    $("#" + poiId).remove();
    map.removeLayer(poiMarkers[poiId]);
}

function isValid(value) {
    if(value != undefined && value != "")
    {
        //return value.replace(/.|_|<|>|$|&/g, "");
        return true;
    }
    return false;
}

function findPoi(poiSpan) {
    let lat = poiSpan.attr("lat");
    let lng = poiSpan.attr("lng");
    map.flyTo({lat: lat, lng:lng}, 17);
}

function saveRoute() {
    console.log("Saving Route!");
    let title = $("#routeTitleInput").val();
    let description = $("#routeDescriptionInput").val();
    let descriptionEnd = $("#routeDescriptionEndInput").val();
    let color = $("#routeColorInput").val();
    let pois = [];
    let routingPoints = pathPoints;

    var errorMsg = "";

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

    if(title.length < 3)
    {
        errorMsg += "Der Routen Name ist zu kurz\n";
    }
    if(routingPoints.length < 2)
    {
        errorMsg += "Nicht genug Routen Punkte vorhanden\n";
    }
    if(!colors.includes(color)){
        errorMsg += "Kein gültige Routen Farbe\n";
    }

    if(errorMsg.length > 0)
    {
        alert(errorMsg);
        return;
    }

    var data = {name: title, description: description, descriptionEnd: descriptionEnd, color: color, pois: pois, routingpoints: routingPoints, checkpoints: checkpoints};

    // 1. Create a new XMLHttpRequest object
    let xhr = new XMLHttpRequest();

    // 2. Configure it: GET-request for the URL /article/.../load

    if(typeof routeId == "undefined")
    {
        xhr.open('POST', '/api/create/route/');
    }
    else
    {
        xhr.open('POST', '/api/edit/route/' + routeId);
    }

    // 3. Send the request over the network
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send("route=" + JSON.stringify(data));

    alert("Route gespeichert!");
    window.location.href = "/route";

}