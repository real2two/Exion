module.exports.load = async function(app) {
    app.get("/logout", async (req, res) => {
        res.cookie("token", "");
        res.redirect("/");
    });
};