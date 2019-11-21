var socket;
map = L.map("map", {maxZoom: 18, minZoom: 5}).setView([51.2277411, 6.7734556], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(map);


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
    socket = io();
    const analyticsString = `<script async src="https://www.googletagmanager.com/gtag/js?id=UA-152743283-1"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
        
            gtag('config', 'UA-152743283-1');
          </script>`;
    $("head").append(analyticsString);
}

let marchLocations = {};

async function init() {
    $.ajax({url: "/api/marches", context: document.body}).done(function (t) {
        let o = t;
        for (let t = 0; t < o.length; t++) {
            const a = o[t];
            a.active && -1 != a.latlng[0] && -1 != a.latlng[1] && createMarchLocation(o[t])
        }
    }), await $.ajax({url: "/api/routes", context: document.body}).done(async function (t) {
        let o = t, a = Object.keys(t);
        for (let t = 0; t < a.length; t++) {
            !0 === o[a[t]].active && $.ajax({url: "/api/route/" + a[t], context: document.body}).done(function (o) {
                drawRouteByCoords(o), t == a.length - 1 && $("#loading").hide()
            })
        }
    }), map.on("locationfound", onLocationFound), socket.on("msg", t => {
        alert(t)
    }), socket.on("updateMarch", t => {
        $.ajax({url: "/api/march/" + t, context: document.body}).done(function (o) {
            try {
                deleteMarchLocation(t)
            } catch (t) {
            }
            console.log(o), o.active && -1 != o.latlng[0] && null != o.latlng[1] && createMarchLocation(o)
        })
    }), socket.on("updateMarchLocation", t => {
        try {
            deleteMarchLocation(t._id)
        } catch (t) {
        }
        t.active && -1 != t.latlng[0] && null != t.latlng[1] && createMarchLocation(t)
    }), socket.on("deleteMarch", t => {
        deleteMarchLocation(t)
    })
}

function onLocationFound(t) {
    L.marker(t.latlng).addTo(map).bindPopup("Deine Position").openPopup()
}

function createMarchLocation(march) {
    const id = march._id, lastUpdate = march.lastUpdate, d = new Date(lastUpdate);
    let houres = d.getHours(), minutes = d.getMinutes();
    houres < 10 && (houres = "0" + houres), minutes < 10 && (minutes = "0" + minutes), console.log(minutes);
    const formatedLastUpdate = houres + ":" + minutes, name = march.name, color = march.color, location = march.latlng,
        mapsUrl = "https://maps.google.com/?q=" + location[0] + "," + location[1];
    let marker = L.marker(location, {icon: eval(color + "Protest")}).addTo(map);
    marker.bindPopup("<b>" + name + "</b><br>Zuletzt aktualisiert: " + formatedLastUpdate + "<br><a target='_blank' href='" + mapsUrl + "' style='vertical-align: middle;'><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'>Navigation starten</a>"), marchLocations[id] = marker
}

function deleteMarchLocation(t) {
    map.removeLayer(marchLocations[t]), delete marchLocations[t]
}

function drawRouteByCoords(t) {
    t._id;
    let o = t.checkpoints, a = (t.name, t.color), e = t.description, n = t.descriptionEnd, l = t.pois;
    var i = new L.Polyline(o, {color: a, weight: 8, opacity: .8, smoothFactor: 5});
    i.addTo(map);
    L.polylineDecorator(i, {
        patterns: [{
            offset: 5,
            repeat: 80,
            symbol: L.Symbol.arrowHead({pixelSize: 10, polygon: !1, pathOptions: {stroke: !0, color: "black"}})
        }]
    }).addTo(map);
    for (let t = 0; t < l.length; t++) {
        let o = l[t], a = L.marker(o.latlng, {icon: blackIcon}).addTo(map),
            e = "https://maps.google.com/?q=" + o.latlng.lat + "," + o.latlng.lng;
        a.bindPopup("<b>" + o.title + "</b><br><p>" + o.description + "</p><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'><a target='_blank' href='" + e + "' style='vertical-align: middle;'>Navigation starten</a>")
    }
    const c = "https://maps.google.com/?q=" + o[0].lat + "," + o[0].lng;
    L.marker(o[0], {icon: greenIcon}).addTo(map).bindPopup("<b>Start</b><br><p>" + e + "</p><a target='_blank' href='" + c + "' style='vertical-align: middle;'><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'>Navigation starten</a>");
    const r = "https://maps.google.com/?q=" + o[o.length - 1][0] + "," + o[o.length - 1][1];
    L.marker(o[o.length - 1], {icon: redIcon}).addTo(map).bindPopup("<b>Ende</b><br><p>" + n + "</p><img src=\"https://img.icons8.com/color/48/000000/google-maps.png\" style='width: 22px;vertical-align: middle;'><a target='_blank' href='" + r + "' style='vertical-align: middle;'>Navigation starten</a>")
}
analytics();
init();