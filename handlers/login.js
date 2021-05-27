const functions = require("../functions.js");

module.exports.load = async function(app) {
    app.get("/login", async (req, res) => {
        res.render("login", {
            req: req
        });
    });

    app.post("/login", async (req, res) => {
        if (typeof req.body !== "object") return res.json({ error: "The request's body must be an object." });
        if (Array.isArray(req.body)) return res.json({ error: "The request's body cannot be an array." });
        if (!req.body) return res.json({ error: "The request's body cannot be null." });

        if (typeof req.body.email !== "string") return res.json({ error: `The variable "email" must be a string.` });
        req.body.email = req.body.email.trim().toLowerCase();
        if (!(await functions.validateEmail(req.body.email))) return res.json({ error: `The variable "email" must be an email.` });
        if (req.body.email.length < 3) return res.json({ error: "The email must be at least 3 characters." });
        if (req.body.email.length > 320) return res.json({ error: "The email cannot be greater than 320 characters." });

        if (typeof req.body.password !== "string") return res.json({ error: `The variable "password" must be a string.` });
        if (req.body.password.length < 6) return res.json({ error: "The password must be at least 6 characters." });
        if (req.body.password.length > 72) return res.json({ error: "The password cannot be over 72 characters." });

        let id = await process.db.emails_to_ids.get(req.body.email);

        if (!id) return res.json({ error: `Could not find account with the provided email.` });

        if (!(await functions.rateLimitCheck(id, res))) return;

        let password = process.encrypter.test(process.encrypter.password + req.body.password).decrypt(await process.db.passwords.get(id));

        if (!password) return res.json({ error: "The provided password is incorrect." });
        if (password !== req.body.password) return res.json({ error: "The provided password is incorrect." });

        let token = (await process.db.user_info.get(id)).token;

        return res.json({ error: "There are no errors.", id: id, token: token });
    });
};