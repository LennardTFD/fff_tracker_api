var express = require('express');
var router = express.Router();

const Database = require("../Classes/Database");
const db = new Database();

//Get all routes
router.get('/', async function (req, res, next) {

    const routes = await db.connect().then(async () => {
        return await db.getRoutes();
    });
    res.render("admin", {routes: routes});

});

router.get('/create', async function (req, res, next) {

    const routes = await db.connect().then(async () => {
        return await db.getRoutes();
    });
    res.render("route_create");

});

module.exports = router;