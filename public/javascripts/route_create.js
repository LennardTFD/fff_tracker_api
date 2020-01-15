//Erstelle Karte mit Blick auf Düsseldorf
var map = L.map('map').setView([51.2277411, 6.7734556], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

let routingPoints = [];
let pathPoints = [];
let checkpoints = [];
let route;
let control;
let poiMarkers = {};

//Mögliche Routen Farben
const colors = ["red", "green", "blue", "violet", "grey", "black", "yellow", "orange"];

//Colorize Background of Color Select
$("#routeColorInput").on("change", (e) => {
    $("#routeColorInput").css("background-color", $("#routeColorInput").val());
});

//Erstelle Routen Handler/Marker an Maus Klick Stelle
map.on('click', function(e){
    createRoutingPoint(e);
});



//Init Berechne ROute
async function calcRoute() {
    //Setze "PathPoints" zurück
    pathPoints = [];
    //Wenn Weniger als zwei Routen Punkte exisiteren, Brich ebrechnung ab
    if(routingPoints.length < 2) return;
    //Coordinaten String für ORS
    var coordString = "";
    var coordArray = [];
    //Für jeden Routen Punkt
    for(let i = 0; i < routingPoints.length; i++)
    {
        //Schreibe Koorinaten in ORS Query String
        pathPoints.push(routingPoints[i]._latlng);
        coordString += routingPoints[i]._latlng.lng + "," + routingPoints[i]._latlng.lat + "|";
        coordArray.push([routingPoints[i]._latlng.lng, routingPoints[i]._latlng.lat]);
    }
    //Entferne letzte Pipe "|" aus ORS Query String
    coordString = coordString.slice(0, -1);
    //Erstelle URL mit Query String
    //var url = "https://api.openrouteservice.org/directions?coordinates=" + coordString + "&instructions=false&instructions_format=text&geometry_format=geojson&preference=shortest&units=m&profile=cycling-road&api_key=58d904a497c67e00015b45fc4f1ca5bb772b4a179eb9de97a5f03f5e";
    var url = "https://api.openrouteservice.org/v2/directions/cycling-road/geojson";
    var details = {"coordinates": coordArray, "units": "m", "instructions": false};
    //Lies Route aus ORS API
    getRouting(url, details);
}

//Lies Route von Openrouteservice
function getRouting(url, details) {
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(details),
        contentType: "application/json; charset=utf-8",
        beforeSend: (xhr) => {
            xhr.setRequestHeader("Authorization", "58d904a497c67e00015b45fc4f1ca5bb772b4a179eb9de97a5f03f5e")
        }
    }).done(function(e) {
        console.log(e);
        drawRoute(e);
    });
}

//zeichne Route auf Karte
function drawRoute(api) {
    //Setze Routen checkpoints zurück
    checkpoints = [];
    //Wenn Route auf Karte exitisert
    if(route != null)
    {
        //Entferne Routen Linie auf Karte
        map.removeLayer(route);
    }
    //Lies Choordinaten der Checkpoints
    //let routePoints = api.routes[0].geometry.coordinates;
    let routePoints = api.features[0].geometry.coordinates;
    let routeLength = api.features[0].properties.summary.distance;
    $("#routeLength").text(Math.round(routeLength));
    //Für jeden Punkt, wandel Array in JSON Objekt um
    let points = routePoints.map((e) => {return {lat: e[1], lng: e[0]}});
    //Zeichne Route mir allen Checkpoints
    route = new L.Polyline(points, {
        color: "blue",
        weight: 6,
        opacity: 0.8,
        smoothFactor: 2
    });
    //Aktiviere ROute auf Karte
    route.addTo(map);
    //Füge alle Punkte zu Checkpoints array hinzu
    checkpoints = points;
}


//Erstelle Routen Punnkt
function createRoutingPoint(e, calc = true)
{
    //Erstelle ROuten Marker
    var marker = new L.marker(e.latlng, {draggable: true}).addTo(map);
    //Füge Marker zu Routen Punkt Array hinzu
    routingPoints.push(marker);
    //Lösche Marker wenn er angeklickt wird
    marker.on('click', function() {
        console.log("Click");
        deleteRoutingPoint(marker);
        //Berechne neue Route
        calcRoute();
    });
    //Berechne neue Route wenn Marker bewegt wird
    marker.on('dragend', function() {
        console.log("Dragend");
        calcRoute();
    });
    //Wenn Parameter Calc = true gestzt ist, berechne Route
    //Sinnvoll beim Laden der Routen zum Bearbeiten. Berechnet Route erst,
    // wenn alle Handle Punkt erstellt wurden
    if (calc) calcRoute();
}

//Entferne Routen Punkt
function deleteRoutingPoint(marker) {
    //Finde Marker in Array
    let markerPos = routingPoints.indexOf(marker);
    //Entferne Marker aus Array
    routingPoints.splice(markerPos, 1);
    //Entferne Marker von Karte
    map.removeLayer(marker);
    //Wenn eine Route exisiter (Linie auf Karte)
    if(route != null)
    {
        //Entferne Routen Linien
        map.removeLayer(route);
    }
    //zeichne neue Routen Linien
    calcRoute();
}

//Create POI Marker on Map
//Create new Inputs in Route editor
function addPoi(name = undefined, description = undefined, location = undefined) {
    //ID wird durch Erstellungs Uhrzeit generiert
    let id = (new Date()).getTime();
    //Wenn kein Name, Beschreibung und Standort bekannt, erstell neuen POI ohne Infos (Neuer POI)
    if(name == undefined && description == undefined && location == undefined)
    {
        var marker = L.marker(map.getCenter(), {icon: blackIcon, draggable: true}).addTo(map);
        var content = "<span id='" + id + "' class='poi'><a style='font-weight: bold' href='#' onclick='findPoi($(this).parent())'>POI Name:</a><input placeholder='POI Name' class='poiName'><p>POI Beschreibung:</p><input placeholder='POI Beschreibung' class='poiDescription'><br><input type='button' onclick='removePoi(" + id + ")' value='Entfernen'><hr></span>";
    }
    //Wenn Name, Beschreibung und Standort bekannt, erstelle neuen POI mit Infos (Geladener POI)
    else
    {
        var marker = L.marker(location, {icon: blackIcon, draggable: true}).addTo(map);
        var content = "<span id='" + id + "' class='poi'><a style='font-weight: bold' href='#' onclick='findPoi($(this).parent())'>POI Name:</a><input placeholder='POI Name' class='poiName' value='" + name + "'><p>POI Beschreibung:</p><input placeholder='POI Beschreibung' class='poiDescription' value='" + description + "'><br><input type='button' onclick='removePoi(" + id + ")' value='Entfernen'><hr></span>";
    }
    //Füge POI Formular hinzu
    content = $(content).appendTo("#pois");
    //Setze Handler Attribute mit LatLng Daten des POI
    $(content).attr("lat", marker.getLatLng().lat);
    $(content).attr("lng", marker.getLatLng().lng);
    //Aktualisiere LatLng Daten des POS, wenn bewegt
    marker.on("dragend", (e) => {
        var marker = e.target;
        $(content).attr("lat", marker.getLatLng().lat);
        $(content).attr("lng", marker.getLatLng().lng);
    });
    //Füge Marker mit ID zu Liste mit POI Markern hinzu
    poiMarkers[id] = marker;
}

//Entferne POI
function removePoi(poiId) {
    $("#" + poiId).remove();
    map.removeLayer(poiMarkers[poiId]);
}

//Überprüfe Richtigkeit von Werten
function isValid(value) {
    if(value != undefined && value != "")
    {
        //return value.replace(/.|_|<|>|$|&/g, "");
        return true;
    }
    return false;
}

//Bewege Kamera auf POI
function findPoi(poiSpan) {
    let lat = poiSpan.attr("lat");
    let lng = poiSpan.attr("lng");
    map.flyTo({lat: lat, lng:lng}, 17);
}

async function addressToCoords(query) {
    if(!query.contains("Düsseldorf")) query += " Düsseldorf";
    let url = "https://nominatim.openstreetmap.org/search?q=" + query;

    return await $.ajax({
        type: "GET",
        url: url
    }).done(function(e) {
        return [e[0].lat, e[0].lon];
    });

}

//Route speichern
function saveRoute() {
    //console.log("Saving Route!");
    //Lies Routen Titel
    let title = $("#routeTitleInput").val();
    //Lies Routenstart Beschreibung
    let description = $("#routeDescriptionInput").val();
    //Lies Routenende Beschreibung
    let descriptionEnd = $("#routeDescriptionEndInput").val();
    //Lies Routen Farbe
    let color = $("#routeColorInput").val();
    let pois = [];
    let routingPoints = pathPoints;

    //Erstelle Fehler Meldungs Constructor
    var errorMsg = "";

    //Für jeden auf der Karte estellen POI
    $("#pois").find(".poi").each((e, t) => {
        var poi = $(t);
        //Lies POI Name, Beschreibung und Latitude/Longitude
        var name = poi.find(".poiName:eq(0)").val();
        var description = poi.find(".poiDescription:eq(0)").val();
        var latlng = {lat: poi.attr("lat"), lng: poi.attr("lng")};
        pois.push({latlng: latlng, title: name, description: description});
    });

    //Füge Fehlermeldung hinzu, wenn Routen Name kürzer als 3 Zeichen ist
    if(title.length < 3)
    {
        errorMsg += "Der Routen Name ist zu kurz\n";
    }
    //Füge Fehlermeldung hinzu, wenn weniger als zwei Routen Punkte erstllt wurden
    if(routingPoints.length < 2)
    {
        errorMsg += "Nicht genug Routen Punkte vorhanden\n";
    }
    //Füge Fehlermeldung hinzu, bei fehlerhafter Farner
    if(!colors.includes(color)){
        errorMsg += "Kein gültige Routen Farbe\n";
    }

    //Wenn mindestens eine Fehlermeldungen auftritt
    if(errorMsg.length > 0)
    {
        //Gib Fehlermeldung aus
        alert(errorMsg);
        //Brich Speichern ab
        return;
    }

    //Füge Routen Informationen hinzu
    var data = {name: title, description: description, descriptionEnd: descriptionEnd, color: color, pois: pois, routingpoints: routingPoints, checkpoints: checkpoints};

    let xhr = new XMLHttpRequest();
    //Wenn RoutenID nicht gesetzt = Route erstellen
    if(typeof routeId == "undefined")
    {
        xhr.open('POST', '/api/create/route/');
    }
    //Wenn RoutenID gesetzt ist = Route mir routenID bearbeiten
    else
    {
        xhr.open('POST', '/api/edit/route/' + routeId);
    }
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send("route=" + JSON.stringify(data));

    //Bestätige Speichern
    alert("Route gespeichert!\nDu wirst in kürze weiter geleitet");
    window.location.href = "/route";
}