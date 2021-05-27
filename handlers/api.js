module.exports.load = async function(app) {
    app.all("/api", async (req, res) => {
        res.json({ error: "This is an empty API endpoint." });
    });
};