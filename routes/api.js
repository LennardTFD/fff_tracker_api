//module.exports = (router, io) => {

var express = require('express');
const Database = require("../Classes/Database");
const db = new Database();
const {CONFIG} = require("../Constants");

let api = (app, io, cache) => {
    var router = express.Router();



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


    function requiresLogin(req, res, next) {
        if ((req.session && req.session.loggedin) || req.body.password == CONFIG.LOGINPASSWORD || req.query.password == CONFIG.LOGINPASSWORD) {
            return next();
        } else {
            res.type("json");
            res.status(401);
            res.send({msg: "unauthorized"});
        }
    }


    router.get('/', function (req, res, next) {
        res.send(documentation);
    });

//Get all Marches
    router.get('/marches/', async function (req, res, next) {
        res.status(200);
        res.type("json");

        if (!cache.keyExists(["marches"])) {
            cache.cache = Object.assign(cache.cache, {
                "marches": await db.connect().then(async () => {
                    return await db.getMarches();
                })
            });
        }
        res.send(cache.cache["marches"]);

    });

//Get March by marchId
    router.get('/march/:marchId', async function (req, res, next) {
        let marchId = parseInt(req.params.marchId);
        res.status(200);
        res.type("json");

        if(!cache.keyExists(["march"]))
        {
            cache.cache = Object.assign(cache.cache, {"march": {}});
        }
        if (!cache.keyExists(["march", String(marchId)])) {
            /*
            cache.cache = Object.assign({}, cache.cache, {
                "march": {
                    [String(marchId)]: await db.connect().then(async () => {
                        return await db.getMarchById(marchId);
                    })
                }
            });
             */

            cache.cache["march"][String(marchId)] = await db.connect().then(async () => {
                return await db.getMarchById(marchId);
            });
        }
        let resp = cache.cache["march"][String(marchId)];
        if(!resp.active)
        {
            resp.latlng = [-1,-1];
        }
        res.send(resp);
    });

//Get location of march by marchId
    router.get('/march/:marchId/location', async function (req, res, next) {
        res.status(200);
        res.type("json");
        res.send(await db.connect().then(async () => {
            var t = await db.getMarchById(req.params.marchId);
            return {lat: t.latlng[0], lng: t.latlng[1]};
        }));
    });

//Set Location of marchId
    router.post('/march/:marchId/location', requiresLogin, async function (req, res, next) {
        let marchId = parseInt(req.params.marchId);
        let lat = parseFloat(req.body.lat);
        let lng = parseFloat(req.body.lng);
        res.type("json");
        if ((lat == undefined || typeof lat != "number") || (lng == undefined || typeof lng != "number") || (marchId == undefined || typeof marchId != "number")) {
            res.status(400);
            res.send({msg: "Faulty Parameters"});
            return false;
        }
        let lastUpdate = (new Date()).getTime();
        let march = await db.connect().then(async () => {
            //await db.updateMarchLocation(marchId, [lat, lng], lastUpdate);
            return await db.updatAndGetMarchLocation(marchId, [lat, lng], lastUpdate);
        });

        cache.cache["march"][String(marchId)] = march;
        cache.cache = Object.assign(cache.cache, {
            "marches": await db.connect().then(async () => {
                return await db.getMarches();
            })
        });
        //io.sockets.emit("updateMarch", marchId);
        io.sockets.emit("updateMarchLocation", march);
        res.status(200);
        res.send({msg: "location set"});
    });

    router.post('/march/:marchId/status/:status', requiresLogin, async function (req, res, next) {
        let status = req.params.status;
        let marchId = parseInt(req.params.marchId);
        if (status == "true") {
            status = true;
        } else if (status == "false") {
            status = false
        } else {
            res.status(400);
            res.type("json");
            res.send({msg: "invalid status"});
        }

        res.status(200);
        res.type("json");
        let march = await db.connect().then(async () => {
            return await db.setMarchStatus(parseInt(req.params.marchId), status);
        });

        if(!cache.keyExists(["march"]))
        {
            cache.cache["march"] = {};
        }

        if(!status)
        {
            march.latlng = [-1, -1];
        }
        cache.cache["march"][String(marchId)] = march;
        cache.cache = Object.assign(cache.cache, {
            "marches": await db.connect().then(async () => {
                return await db.getMarches();
            })
        });

        if (status) {
            io.sockets.emit("updateMarch", marchId);
        } else {
            io.sockets.emit("deleteMarch", marchId);

        }

        res.send({msg: "success"});
    });

//Get all routes
    router.get('/routes/', async function (req, res, next) {
        res.status(200);
        res.type("json");

        if (!cache.keyExists(["routes"])) {
            cache.cache = Object.assign(cache.cache, {
                "routes": await db.connect().then(async () => {
                    return await db.getRoutes();
                })
            });
        }
        res.send(cache.cache["routes"]);
    });

//Get route by routeId
    router.get('/route/:routeId', async function (req, res, next) {
        let routeId = parseInt(req.params.routeId);
        res.status(200);
        res.type("json");

        if (!cache.keyExists(["route"])) {
            cache.cache = Object.assign(cache.cache, {"route": {}})
        }
        if (!cache.keyExists(["route", String(routeId)])) {
            cache.cache["route"][String(routeId)] = await db.connect().then(async () => {
                return await db.getRouteById(routeId);
            })
        }
        console.log("reading from cache");
        res.send(cache.cache["route"][String(routeId)]);
    });

//Get route by routeId
    router.post('/route/:routeId/status/:status', requiresLogin, async function (req, res, next) {
        let status = req.params.status;
        if (status == "true") {
            status = true;
        } else if (status == "false") {
            status = false
        } else {
            console.log("invalid");
            res.status(400);
            res.type("json");
            res.send({msg: "invalid status"});
        }

        res.status(200);
        res.type("json");
        let route = await db.connect().then(async () => {
            return await db.setRouteStatus(parseInt(req.params.routeId), status);
        });

        cache.cache["route"][req.params.routeId] = route;

        cache.cache = Object.assign(cache.cache, {
            "routes": await db.connect().then(async () => {
                return await db.getRoutes();
            })
        });

        res.send({msg: "success"});
    });

//Create route
    router.post('/create/route/', requiresLogin, async function (req, res, next) {

        let route = JSON.parse(req.body.route);
        let name = route.name;
        let description = route.description;
        let descriptionEnd = route.descriptionEnd;
        let color = route.color;
        let checkpoints = route.checkpoints;
        let routingpoints = route.routingpoints;
        let pois = route.pois;
        let distance = route.distance;

        res.status(200);
        res.type("json");
        await db.connect().then(async () => {
            return await db.createRoute(name, description, descriptionEnd, color, checkpoints, routingpoints, pois, distance);
        });

        cache.cache = Object.assign(cache.cache, {
            "routes": await db.connect().then(async () => {
                return await db.getRoutes();
            })
        });

        res.send({msg: "success"});
    });

    router.post('/edit/route/:routeId', requiresLogin, async function (req, res, next) {

        let route = JSON.parse(req.body.route);
        let name = route.name;
        let description = route.description;
        let descriptionEnd = route.descriptionEnd;
        let color = route.color;
        let checkpoints = route.checkpoints;
        let routingpoints = route.routingpoints;
        let pois = route.pois;
        let distance = route.distance;

        res.status(200);
        res.type("json");
        let rt = await db.connect().then(async () => {
            return await db.editRoute(parseInt(req.params.routeId), name, description, descriptionEnd, color, checkpoints, routingpoints, pois, distance);
        });

        cache.cache = Object.assign(cache.cache, {
            "routes": await db.connect().then(async () => {
                return await db.getRoutes();
            })
        });
        cache.cache["route"][req.params.routeId] = rt;

        res.send({msg: "success"});
    });

    router.post('/edit/march/:marchId', requiresLogin, async function (req, res, next) {

        let march = JSON.parse(req.body.march);
        let name = march.name;
        let color = march.color;

        res.status(200);
        res.type("json");
        let marchUpdated = await db.connect().then(async () => {
            return await db.editMarch(parseInt(req.params.marchId), name, color);
        });
        //console.log(marchUpdated);
        io.sockets.emit("updateMarchLocation", marchUpdated);

        cache.cache["march"][req.params.marchId] = marchUpdated;
        cache.cache = Object.assign(cache.cache, {
            "marches": await db.connect().then(async () => {
                return await db.getMarches();
            })
        });

        res.send({msg: "success"});
    });

//Create march
    router.post('/create/march/', requiresLogin, async function (req, res, next) {

        let march = JSON.parse(req.body.march);
        //console.log(march);
        let name = march.name;
        let color = march.color;
        let latlng = march.latlng;

        res.status(200);
        res.type("json");

        await db.connect().then(async () => {
            return await db.createMarch(name, color, latlng);
        });

        cache.cache = Object.assign(cache.cache, {
            "marches": await db.connect().then(async () => {
                return await db.getMarches();
            })
        });

        res.send({"msg": "successful"});
    });


//Delete route
    router.post('/delete/route/:routeId', requiresLogin, async function (req, res, next) {
        res.status(200);
        res.type("json");
        io.sockets.emit("deleteRoute", req.params.routeId);
        await db.connect().then(async () => {
            return await db.deleteRoute(parseInt(req.params.routeId));
        });

        cache.cache = Object.assign(cache.cache, {
            "routes": await db.connect().then(async () => {
                return await db.getRoutes();
            })
        });
        delete cache.cache["route"][req.params.routeId];
        res.send({msg: "success"});
    });

//Delete march
    router.post('/delete/march/:marchId', requiresLogin, async function (req, res, next) {
        let marchId = parseInt(req.params.marchId);
        res.status(200);
        res.type("json");
        io.sockets.emit("deleteMarch", req.params.marchId);
        await db.connect().then(async () => {
            return await db.deleteMarch(parseInt(req.params.marchId));
        });
        cache.cache = Object.assign(cache.cache, {
            "marches": await db.connect().then(async () => {
                return await db.getMarches();
            })
        });
        delete cache.cache["march"][req.params.marchId];
        io.sockets.emit("deleteMarch", marchId);
        res.send({msg: "success"});
    });

    router.get("/cache", (req, res, next) => {
        res.status(200);
        res.type("json");
        res.send(cache.cache);
    });

    router.post("/cache/reset", requiresLogin, (req, res, next) => {
        cache.reset();
        res.status(200);
        res.type("json");
        res.send({msg: "success"});
    });


    return router;
}
module.exports = api;