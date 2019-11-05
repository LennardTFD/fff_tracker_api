var express = require('express');
var router = express.Router();

const Database = require("../Classes/Database");
const db = new Database();
//DB Format
// Table: ROUTES
// | [int] routeId | [string] name | [string] description | [array] checkpoints | [array] routingpoints | [array] pois | [string] color | [bool] active |

// Table: MARCH
// | [int] marchId | [string] name  | [color] color | [array] latlng | [timestamp] lastUpdate | [bool] active |

//Table: COUNTER
// | _id = ROUTES| value = -1 |
// | _id = MARCHES| value = -1 |

const documentation = `
<title>API Documentation</title>
<h2>GET</h2>
<hr>
<h4>/marches/</h4>
<p>Returns all marches</p>
<hr>
<h4>/march/:marchId</h4>
<p>Returns march with marchId</p>
<hr>
<h4>/march/:marchId/location</h4>
<p>Returns location of march with marchId</p>
<hr>
<h4>/routes/</h4>
<p>Returns all routes</p>
<hr>
<h4>/route/:routeId</h4>
<p>Returns route with routeId</p>
<hr>
<h2>POST</h2>
<hr>
<h4>/march/:marchId/location</h4>
<h5>Params</h5>
<h6>lat [number]</h6>
<h6>lng [number]</h6>
<p>Sets location of march with marchId</p>
<hr>
`;

router.get('/', function (req, res, next) {
    res.send(documentation);
});

//Get all Marches
router.get('/marches/', async function (req, res, next) {
    res.status(200);
    res.type("json");
    res.send(await db.connect().then(async () => {
        return await db.getMarches();
    }));
});

//Get March by marchId
router.get('/march/:marchId', async function (req, res, next) {
    res.status(200);
    res.type("json");
    res.send(await db.connect().then(async () => {
        return await db.getMarchById(parseInt(req.params.marchId));
    }));
});

//Get location of march by marchId
router.get('/march/:marchId/location', async function (req, res, next) {
    res.status(200);
    res.type("json");
    res.send(await db.connect().then(async () => {
        var t = await db.getMarchById(parseInt(req.params.marchId));
        return {lat: t.latlng[0], lng: t.latlng[1]};
    }));
});

//Set Location of marchId
router.post('/march/:marchId/location', async function (req, res, next) {
    let marchId = parseInt(req.params.marchId);
    let lat = parseFloat(req.body.lat);
    let lng = parseFloat(req.body.lng);
    if ((lat == undefined || typeof lat != "number") || (lng == undefined || typeof lng != "number") || (marchId == undefined || typeof marchId != "number")) {
        res.status(400);
        res.send({msg: "Faulty Parameters"});
        return false;
    }
    let lastUpdate = (new Date()).getTime();
    await db.connect().then(async () => {
        await db.updateMarchLocation(marchId, [lat, lng], lastUpdate);
    });
    res.status(200);
    res.send({msg: "location set"});
});

//Get all routes
router.get('/routes/', async function (req, res, next) {
    res.status(200);
    res.type("json");
    res.send(await db.connect().then(async () => {
        return await db.getRoutes();
    }));

});

//Get route by routeId
router.get('/route/:routeId', async function (req, res, next) {
    res.status(200);
    res.type("json");
    res.send(await db.connect().then(async () => {
        return await db.getRouteById(parseInt(req.params.routeId));
    }));
});

//Create route
router.post('/create/route/', async function (req, res, next) {
    
    let route = JSON.parse(req.body.route);
    let name = route.name;
    let description = route.description;
    let descriptionEnd = route.descriptionEnd;
    let color = route.color;
    let checkpoints = route.checkpoints;
    let routingpoints = route.routingpoints;
    let pois = route.pois;

    res.status(200);
    res.type("json");
    await db.connect().then(async () => {
        return await db.createRoute(name, description, descriptionEnd, color, checkpoints, routingpoints, pois);
    });

    res.send({msg: "success"});
});

//Create march
router.post('/create/march/', async function (req, res, next) {

    let name = req.body.name;
    let color = req.body.color;
    let latlng = [parseFloat(req.body.lat), parseFloat(req.body.lng)];

    res.status(200);
    res.type("json");
    res.send(await db.connect().then(async () => {
        return await db.createMarch(name, color, latlng);
    }));
});


//Delete route
router.post('/delete/route/:routeId', async function (req, res, next) {
    res.status(200);
    res.type("json");
    res.send(await db.connect().then(async () => {
        return await db.deleteRoute(parseInt(req.params.routeId));
    }));
});

//Delete march
router.post('/delete/march/:marchId', async function (req, res, next) {
    res.status(200);
    res.type("json");
    res.send(await db.connect().then(async () => {
        return await db.deleteMarch(parseInt(req.params.marchId));
    }));
});

module.exports = router;