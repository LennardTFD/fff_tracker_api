var express = require('express');
var router = express.Router();

const Database = require("../Classes/Database");
const db = new Database();

//Get all routes
router.get('/', async function (req, res, next) {

    const routes = await db.connect().then(async () => {
        return await db.getRoutes();
    });
    console.log(routes);
    res.render("route", {routes: routes});


});

router.get('/create', async function (req, res, next) {
    res.render("route_create");
});

router.get('/edit/:routeId', async function (req, res, next) {

    let routeId = parseInt(req.params.routeId);
    res.render("route_create", {edit: true, routeId: routeId});
});

module.exports = router;