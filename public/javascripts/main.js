//var socket = io();
//Create Map Layer
var map = L.map('map').setView([51.2277411, 6.7734556], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

let marchLocations = {};

async function init()
{
    //Get Marches
    $.ajax({
        url: "/api/marches",
        context: document.body
    }).done(function(resp) {
        //console.log(resp);
        let marches = resp;
        let marchIds = Object.keys(resp);
        for(let i = 0; i < marchIds.length; i++)
        {
            const active = marches[marchIds[i]].active;
            if(active)
            {
                createMarchLocation(marches[marchIds[i]]);
            }
        }
    });

    //Get Routes
    $.ajax({
        url: "/api/routes",
        context: document.body
    }).done(function(resp) {
        //console.log(resp);
        let routes = resp;
        let routeIds = Object.keys(resp);
        for(let i = 0; i < routeIds.length; i++)
        {
            const active = routes[routeIds[i]].active;
            if(active === true)
            {
                //drawRouteByCoords(routes[routeIds[i]]);
                $.ajax({
                    url: "/api/route/" + routeIds[i],
                    context: document.body
                }).done(function(resp) {
                    //console.log(resp);
                    let route = resp;
                    drawRouteByCoords(route);
                });
            }
        }
    });

    map.on('locationfound', onLocationFound);
}

function onLocationFound(e) {
    L.marker(e.latlng).addTo(map)
        .bindPopup("Deine Position").openPopup();
}


function createMarchLocation(march) {
    const id = march._id;
    const lastUpdate = march.lastUpdate;
    const d = new Date(lastUpdate);
    const formatedLastUpdate = d.getHours() + ":" + d.getMinutes();
    const name = march.name;
    const color = march.color;
    //const color = "violet";
    const location = march.latlng;
    const mapsUrl = "https://maps.google.com/?q=" + location[0] + "," + location[1];
    let marker = L.marker(location, {icon: eval(color+"Icon")}).addTo(map);
    marker.bindPopup("<b>" + name + "</b><br>Zuletzt aktualisiert: " + formatedLastUpdate + "<br><a target='_blank' href='" + mapsUrl + "' style='vertical-align: middle;'><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'>Navigation starten</a>").openPopup();
    marchLocations[id] = marker;
}

function deleteMarchLocation(id) {
    map.removeLayer(marchLocations[id]);
    delete marchLocations[id];
}

function drawRouteByCoords(route) {
    let routeId = route._id;
    let checkpoints = route.checkpoints;
    let name = route.name;
    let color = route.color;
    let descriptionStart = route.description;
    let descriptionEnd = route.descriptionEnd;
    let pois = route.pois;

    var routeWay = new L.Polyline(checkpoints, {
        color: color,
        weight: 6,
        opacity: 0.8,
        smoothFactor: 2,
    });
    routeWay.addTo(map);

    let decorator = L.polylineDecorator(routeWay, {
        patterns: [
            // defines a pattern of 10px-wide dashes, repeated every 20px on the line
            {offset: 5, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 10,  polygon: false, pathOptions: {stroke: true, color: "black"}})}
        ]
    }).addTo(map);


    for(let i = 0; i < pois.length; i++)
    {
        let poi = pois[i];
        let poiMarker = L.marker(poi.latlng, {icon: blackIcon}).addTo(map);
        poiMarker.bindPopup("<b>" + poi.title + "</b><br><p>" + poi.description + "</p>");
    }


    const mapsUrlStart = "https://maps.google.com/?q=" + checkpoints[0].lat + "," + checkpoints[0].lng;
    let startMarker = L.marker(checkpoints[0], {icon: greenIcon}).addTo(map);
    startMarker.bindPopup("<b>Start</b><br><p>" + descriptionStart + "</p><a target='_blank' href='" + mapsUrlStart + "' style='vertical-align: middle;'><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'>Navigation starten</a>").openPopup();
    const mapsUrlEnd = "https://maps.google.com/?q=" + checkpoints[checkpoints.length - 1][0] + "," + checkpoints[checkpoints.length - 1][1];
    let endMarker = L.marker(checkpoints[checkpoints.length - 1], {icon: redIcon}).addTo(map);
    endMarker.bindPopup("<b>Ende</b><br><p>" + descriptionEnd + "</p><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'><a target='_blank' href='" + mapsUrlEnd + "' style='vertical-align: middle;'>Navigation starten</a>");
}

init();
/*
socket.on("test", () => {
    console.log("Test emited!");
});
*/