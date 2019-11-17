var express = require('express');


const Database = require("../Classes/Database");
const db = new Database();

let march = (cache) => {
    var router = express.Router();

//Get all routes
    router.get('/', async function (req, res, next) {

        /*
        const marches = await db.connect().then(async () => {
            return await db.getMarches();
        });
         */

        if (!cache.keyExists(["marches"])) {
            cache.cache = Object.assign(cache.cache, {
                "marches": await db.connect().then(async () => {
                    return await db.getMarches();
                })
            });
        }
        let marches = cache.cache["marches"];

        res.render("march", {marches: marches});
    });

    router.get('/create', async function (req, res, next) {
        res.render("march_create");
    });

    router.get('/edit/:marchId', async function (req, res, next) {

        let marchId = parseInt(req.params.marchId);
        res.render("march_create", {edit: true, marchId: marchId});
    });
    return router;
}

module.exports = march;