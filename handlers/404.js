const functions = require("../functions.js");

module.exports.load = async function(app) {
    app.all("/api/*", functions.notFoundAPI);

    app.get("*", functions.notFound);
};