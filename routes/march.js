var express = require('express');
var router = express.Router();

const Database = require("../Classes/Database");
const db = new Database();

//Get all routes
router.get('/', async function (req, res, next) {

    const marches = await db.connect().then(async () => {
        return await db.getMarches();
    });
    res.render("march", {marches: marches});


});

router.get('/create', async function (req, res, next) {
    res.render("march_create");
});

router.get('/edit/:routeId', async function (req, res, next) {

    let routeId = parseInt(req.params.routeId);
    res.render("march_create", {edit: true, routeId: routeId});
});


module.exports = router;