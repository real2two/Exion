const functions = require("../functions.js");

module.exports.load = async function(app) {
    app.post("/update_email", async (req, res) => {
        if (typeof req.body !== "object") return res.json({ error: "The request's body must be an object." });
        if (Array.isArray(req.body)) return res.json({ error: "The request's body cannot be an array." });
        if (!req.body) return res.json({ error: "The request's body cannot be null." });

        if (typeof req.body.old_email !== "string") return res.json({ error: `The variable "old_email" must be a string.` });
        req.body.old_email = req.body.old_email.trim().toLowerCase();
        if (!(await functions.validateEmail(req.body.old_email))) return res.json({ error: `The variable "old_email" must be an email.` });
        if (req.body.old_email.length < 3) return res.json({ error: "The old email must be at least 3 characters." });
        if (req.body.old_email.length > 320) return res.json({ error: "The old email cannot be greater than 320 characters." });

        if (typeof req.body.new_email !== "string") return res.json({ error: `The variable "new_email" must be a string.` });
        req.body.new_email = req.body.new_email.trim().toLowerCase();
        if (!(await functions.validateEmail(req.body.new_email))) return res.json({ error: `The variable "new_email" must be an email.` });
        if (req.body.new_email.length < 3) return res.json({ error: "The new email must be at least 3 characters." });
        if (req.body.new_email.length > 320) return res.json({ error: "The new email cannot be greater than 320 characters." });

        if (typeof req.body.password !== "string") return res.json({ error: `The variable "password" must be a string.` });
        if (req.body.password.length < 6) return res.json({ error: "The password must be at least 6 characters." });
        if (req.body.password.length > 72) return res.json({ error: "The password cannot be over 72 characters." });

        let id = await process.db.emails_to_ids.get(req.body.old_email);

        if (!id) return res.json({ error: `Could not find account with the provided email.` });

        if (!(await functions.rateLimitCheck(id, res))) return;

        let password = process.encrypter.test(process.encrypter.password + req.body.password).decrypt(await process.db.passwords.get(id));

        if (!password) return res.json({ error: "The provided password is incorrect." });
        if (password !== req.body.password) return res.json({ error: "The provided password is incorrect." });

        if (req.body.old_email == req.body.new_email) return res.json({ error: `The new email you provided is the same as your current email.` });

        if (await process.db.emails_to_ids.get(req.body.new_email)) return res.json({ error: `There is already an account with the provided new email.` });

        await process.db.emails_to_ids.set(req.body.new_email, id);
        await process.db.emails_to_ids.delete(req.body.old_email, id);

        let userinfo = await process.db.user_info.get(id);
        userinfo.email = req.body.new_email;
        await process.db.user_info.set(id, userinfo);

        return res.json({ error: "Successfully changed your email!" });
    });
};