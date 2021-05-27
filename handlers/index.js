module.exports.load = async function(app) {
    app.get("/", async (req, res) => {
        res.render("index");
    });
};