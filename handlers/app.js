module.exports.load = async function(app) {
    app.get("/app", async (req, res) => {
        res.render("app", {
            path: req._parsedUrl.pathname
        });
    });

    app.get("/app/*", async (req, res) => {
        res.render("app", {
            path: req._parsedUrl.pathname
        });
    });
};