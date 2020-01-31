var socket = io();
//Create Map Layer
var map = L.map('map', {maxZoom: 18, minZoom: 5}).setView([51.2277411, 6.7734556], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: "<a href='https://github.com/LennardTFD'>Lennard Giesing</a>"}).addTo(map);

let bounds = [];

function analytics() {
    if(localStorage.getItem("cookieEnabled") != null)
    {
        embed();
        return;
    }
    if (confirm("Damit diese Seite vollständig genutzt werden kann, speichern wir Cookies.\n" +
        "Außerdem erheben wir anonymisierte Daten um die Benutzererfahrung zu verbessern.\n" +
        "Zu unsere Datenschutzbestimmungen gelangen Sie durch abbrechen")) {
        localStorage.setItem("cookieEnabled", "true");
        embed();
    }
    else
    {
        window.location.href = "/datenschutz";
    }
}

function embed()
{

    //const analyticsString = '<script async src="https://www.googletagmanager.com/gtag/js?id=UA-152743283-1"></script>';
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());
    gtag("config", "UA-152743283-1");
    //$("head").append(analyticsString);
}

let marchLocations = {};

async function init()
{
    //Get Marches
    //$('<div id="loading"><img id="loading-image" src="/images/loading.gif" alt="Loading..." /></div>').prependTo(document.body);
    $.ajax({
        url: "/api/marches",
        context: document.body
    }).done(function(resp) {
        //console.log(resp);
        let marches = resp;
        for(let i = 0; i < marches.length; i++)
        {
            const march = marches[i];
            const active = march.active;
            if(active && march.latlng[0] != -1 && march.latlng[1] != -1)
            {
                createMarchLocation(marches[i]);
            }
        }
    });

    //Get Routes
    await $.ajax({
        url: "/api/routes",
        context: document.body
    }).done(async function(resp) {
        //console.log(resp);
        let routes = resp;
        let routeIds = Object.keys(resp);
        for(let i = 0; i < routeIds.length; i++)
        {
            const active = routes[routeIds[i]].active;
            if(active === true)
            {
                //drawRouteByCoords(routes[routeIds[i]]);
                await $.ajax({
                    url: "/api/route/" + routeIds[i],
                    context: document.body
                }).done(function(resp) {
                    //console.log(resp);
                    let route = resp;
                    drawRouteByCoords(route);
                    //map.fitBounds(route.routingPoints);
                    bounds = bounds.concat(route.routingPoints);
                    if(i == routeIds.length - 1)
                    {
                        $("#loading").hide();
                    }
                });
            }
        }
        map.fitBounds(bounds);
    });

    map.on('locationfound', onLocationFound);


    socket.on("msg", (msg)=> {alert(msg)});


    socket.on("updateMarch", (marchId) => {
        //console.log("updateMarch");
        $.ajax({
            url: "/api/march/" + marchId,
            context: document.body
        }).done(function(march) {
            //console.log(resp);
            try{
                deleteMarchLocation(marchId);
            } catch (e) {

            }
            console.log(march);
            if(march.active && march.latlng[0] != -1 && march.latlng[1] != undefined)
            {
                createMarchLocation(march);
            }
        });
    });

    socket.on("updateMarchLocation", (march) => {
        //console.log(march);
        //console.log("updateMarchLocation");
        try{
            deleteMarchLocation(march._id);
        } catch (e) {

        }
        if(march.active && march.latlng[0] != -1 && march.latlng[1] != undefined)
        {
            createMarchLocation(march);
        }
    });

    socket.on("deleteMarch", (marchId) => {
        //console.log("deleteMarch");
        deleteMarchLocation(marchId);
    });

}

function onLocationFound(e) {
    L.marker(e.latlng).addTo(map)
        .bindPopup("Deine Position").openPopup();
}

function createMarchLocation(march) {
    const id = march._id;
    const lastUpdate = march.lastUpdate;
    const d = new Date(lastUpdate);
    let houres = d.getHours();
    let minutes = d.getMinutes();
    if(houres < 10)  houres = "0"+houres;
    if(minutes < 10)  minutes = "0"+minutes;
    console.log(minutes);
    const formatedLastUpdate = houres + ":" + minutes;
    const name = march.name;
    const color = march.color;
    //const color = "violet";
    const location = march.latlng;
    const mapsUrl = "https://maps.google.com/?q=" + location[0] + "," + location[1];
    let marker = L.marker(location, {icon: eval(color+"Protest")}).addTo(map);
    marker.bindPopup("<b>" + name + "</b><br>Zuletzt aktualisiert: " + formatedLastUpdate + "<br><a target='_blank' href='" + mapsUrl + "' style='vertical-align: middle;'><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'>Navigation starten</a>");
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
    let distance = route.distance;

    var routeWay = new L.Polyline(checkpoints, {
        color: color,
        weight: 8,
        opacity: 0.8,
        smoothFactor: 3,
    });
    routeWay.addTo(map);

    let decorator = L.polylineDecorator(routeWay, {
        patterns: [
            // defines a pattern of 10px-wide dashes, repeated every 20px on the line
            {offset: 5, repeat: 80, symbol: L.Symbol.arrowHead({pixelSize: 10,  polygon: false, pathOptions: {stroke: true, color: "black"}})}
        ]
    }).addTo(map);


    for(let i = 0; i < pois.length; i++)
    {
        let poi = pois[i];
        let poiMarker = L.marker(poi.latlng, {icon: blackIcon}).addTo(map);
        let mapsUrlPoi = "https://maps.google.com/?q=" + poi.latlng.lat + "," + poi.latlng.lng;
        poiMarker.bindPopup("<b>" + poi.title + "</b><br><p>" + poi.description + "</p><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'><a target='_blank' href='" + mapsUrlPoi + "' style='vertical-align: middle;'>Navigation starten</a>");
    }


    const mapsUrlStart = "https://maps.google.com/?q=" + checkpoints[0].lat + "," + checkpoints[0].lng;
    let startMarker = L.marker(checkpoints[0], {icon: greenIcon}).addTo(map);
    startMarker.bindPopup("<b>Start</b><br><p>" + descriptionStart + "</p><i>Länge: " + route.distance + "m</i><br><a target='_blank' href='" + mapsUrlStart + "' style='vertical-align: middle;'><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'>Navigation starten</a>");
    const mapsUrlEnd = "https://maps.google.com/?q=" + checkpoints[checkpoints.length - 1].lat + "," + checkpoints[checkpoints.length - 1].lng;
    let endMarker = L.marker(checkpoints[checkpoints.length - 1], {icon: redIcon}).addTo(map);
    endMarker.bindPopup("<b>Ende</b><br><p>" + descriptionEnd + "</p><i>Länge: " + route.distance + "m</i><br><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'><a target='_blank' href='" + mapsUrlEnd + "' style='vertical-align: middle;'>Navigation starten</a>");
}
analytics();
init();

/*
socket.on("msg", (msg) => {
    alert(msg);
});
 */

