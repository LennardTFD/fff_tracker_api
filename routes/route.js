var express = require('express');


const Database = require("../Classes/Database");
const db = new Database();

let route = (cache) => {
    var router = express.Router();
    router.get('/', async function (req, res, next) {

        if (!cache.keyExists(["routes"])) {
            cache.cache = Object.assign(cache.cache, {"routes": await db.connect().then(async () => {
                return await db.getRoutes(marchId);
            })});
        }
        let routes = cache.cache["routes"];
        res.render("route", {routes: routes});


    });

    router.get('/create', async function (req, res, next) {
        res.render("route_create");
    });

    router.get('/edit/:routeId', async function (req, res, next) {

        let routeId = parseInt(req.params.routeId);
        res.render("route_create", {edit: true, routeId: routeId});
    });
    return router;
}
//Get all routes


module.exports = route;