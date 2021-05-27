const functions = require("../functions.js");

module.exports.load = async function(app) {
    app.post("/update_password", async (req, res) => {
        if (typeof req.body !== "object") return res.json({ error: "The request's body must be an object." });
        if (Array.isArray(req.body)) return res.json({ error: "The request's body cannot be an array." });
        if (!req.body) return res.json({ error: "The request's body cannot be null." });

        if (typeof req.body.email !== "string") return res.json({ error: `The variable "email" must be a string.` });
        req.body.email = req.body.email.trim().toLowerCase();
        if (!(await functions.validateEmail(req.body.email))) return res.json({ error: `The variable "email" must be an email.` });
        if (req.body.email.length < 3) return res.json({ error: "The email must be at least 3 characters." });
        if (req.body.email.length > 320) return res.json({ error: "The email cannot be greater than 320 characters." });

        if (typeof req.body.old_password !== "string") return res.json({ error: `The variable "old_password" must be a string.` });
        if (req.body.old_password.length < 6) return res.json({ error: "The old password must be at least 6 characters." });
        if (req.body.old_password.length > 72) return res.json({ error: "The old password cannot be over 72 characters." });

        if (typeof req.body.new_password !== "string") return res.json({ error: `The variable "new_password" must be a string.` });
        if (req.body.new_password.length < 6) return res.json({ error: "The new password must be at least 6 characters." });
        if (req.body.new_password.length > 72) return res.json({ error: "The new password cannot be over 72 characters." });

        let id = await process.db.emails_to_ids.get(req.body.email);

        if (!id) return res.json({ error: `Could not find account with the provided email.` });

        if (!(await functions.rateLimitCheck(id, res))) return;

        let old_password = process.encrypter.test(process.encrypter.password + req.body.old_password).decrypt(await process.db.passwords.get(id));

        if (!old_password) return res.json({ error: "The provided old password is incorrect." });
        if (old_password !== req.body.old_password) return res.json({ error: "The provided old password is incorrect." });

        if (old_password == req.body.new_password) return res.json({ error: `The new password you provided is the same as your current password.` })

        let new_password = process.encrypter.test(process.encrypter.password + req.body.new_password).encrypt(req.body.new_password);

        await process.db.passwords.set(id, new_password);

        return res.json({ error: "Successfully changed your password!" });
    });
};