const functions = require("../functions.js");

module.exports.load = async function(app) {
    app.get("/api/token", async (req, res) => {
        if (!(await functions.ifValidAPI(req, res))) return;
        
        res.json({ error: "There are no errors." });
    });
};