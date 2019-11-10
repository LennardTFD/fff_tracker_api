const Database = require("./Classes/Database");
const db = new Database();


db.connect().then(async () => {
    console.log("Starting Database setup...");
    await db.setupDatabase();
    console.log("Database setup finished");
    console.log("#######################");
    console.log(" You can set the Login ");
    console.log("  password inside the  ");
    console.log("   Constants.js file   ");
    console.log("#######################");
    process.exit(0);
});