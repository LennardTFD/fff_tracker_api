const {ObjectId} = require("mongodb");
const {DB} = require('../Constants');

var mongoClient = require("mongodb").MongoClient,
    db;

class Database {

    async connect() {
        try {
            var connection = await mongoClient.connect(DB.URL, {useNewUrlParser: true, useUnifiedTopology: true});
            this.db = connection.db(DB.DB);
            console.info("MongoClient Connection successfull.");
        } catch (ex) {
            console.error("Error caught,", ex);
        }
    }

    async getMarches()
    {
        let marches = await this.db.collection(DB.MARCHES).find({}).toArray();
        let response = {};
        for(let i = 0; i < marches.length; i++)
        {
            let march = marches[i];
            //response[marches[i]._id] = marches[i];
            //console.log(marches[i]);
            if(!march.active)
            {
                march.latlng = [-1, -1];
            }
            response[march._id] = march;
        }
        return response;
    }

    async getMarchById(marchId)
    {
        let march = await this.db.collection(DB.MARCHES).find({_id: marchId}).toArray();
        if(!march.active)
        {
            march.latlng = [-1, -1];
        }
        return march[0];
    }

    async createMarch(name, color, latlng)
    {
        let query = {
            _id: this.nextId(DB.MARCHES),
            name: name,
            color: color,
            latlng: latlng,
            lastUpdate: (new Date()).getTime(),
            active: false
        };
        await this.db.collection(DB.MARCHES).insertOne(query);
    }


    async updateMarchLocation(marchId, latlng, timestamp)
    {
        await this.db.collection(DB.MARCHES).updateMany({_id: marchId}, {$set: {latlng: latlng, lastUpdate: timestamp}} )
    }

    async deleteMarch(marchId)
    {
        await this.db.collection(DB.MARCHES).deleteOne({_id: marchId});
    }

    //Get List of routes (without Route Information)
    async getRoutes()
    {
        let routes = await this.db.collection(DB.ROUTES).find({}).toArray();
        let response = {};
        for(let i = 0; i < routes.length; i++)
        {
            let route = routes[i];
            delete route.checkpoints;
            delete route.pois;
            response[route._id] = route;
        }
        return response;
    }

    async getRouteById(routeId)
    {
        let route = await this.db.collection(DB.ROUTES).find({_id: routeId}).toArray();
        return route[0];
    }

    async setRouteStatus(routeId, status)
    {
        await this.db.collection(DB.ROUTES).updateOne({_id: routeId}, {$set: {active: status}});
    }


    async createRoute(name, description, descriptionEnd, color, checkpoints, routingPoints, pois)
    {

        //POIS: {latlng: [lat, lng], title: "Zwischenkundgebung", description: "Kurze Beschreibung"}
        let query = {
            _id: await this.nextId(DB.ROUTES),
            name: name,
            description: description,
            descriptionEnd: descriptionEnd,
            color: color,
            checkpoints: checkpoints,
            routingPoints: routingPoints,
            pois: pois,
            active: false
        };
        await this.db.collection(DB.ROUTES).insertOne(query);
    }

    async editRoute(routeId, name, description, descriptionEnd, color, checkpoints, routingPoints, pois)
    {

        //POIS: {latlng: [lat, lng], title: "Zwischenkundgebung", description: "Kurze Beschreibung"}
        let query = {
            _id: routeId,
            name: name,
            description: description,
            descriptionEnd: descriptionEnd,
            color: color,
            checkpoints: checkpoints,
            routingPoints: routingPoints,
            pois: pois
        };
        await this.db.collection(DB.ROUTES).updateOne({_id: routeId}, {$set: query});
    }

    async deleteRoute(routeId)
    {
        await this.db.collection(DB.ROUTES).deleteOne({_id: routeId});
    }

    async nextId(table)
    {
        let nextId = await this.db.collection(DB.COUNTER).find({_id: table}).toArray();
        nextId = nextId[0].lastIndex + 1;
        await this.db.collection(DB.COUNTER).updateOne({_id: table}, {$set: {lastIndex: nextId}});
        return nextId;
    }

}

module.exports = Database;