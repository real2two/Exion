const functions = require("../functions.js");

const default_pfp_colors = ["blue", "green", "red", "yellow"];

module.exports.load = async function(app) {
    app.get("/register", async (req, res) => {
        if (!req.query.code) return functions.notFound(req, res);

        if (!(await process.db.invite_codes.get(req.query.code))) return functions.notFound(req, res);

        res.render("register", {
            req: req,
            code: req.query.code
        });
    });

    app.post("/register", async (req, res) => {
        if (typeof req.body !== "object") return functions.notFound(req, res); // return res.json({ error: "The request's body must be an object." });
        if (Array.isArray(req.body)) return functions.notFound(req, res); // return res.json({ error: "The request's body cannot be an array." });
        if (!req.body) return functions.notFound(req, res); // return res.json({ error: "The request's body cannot be null." });

        if (typeof req.body.code !== "string") return functions.notFound(req, res); // return res.json({ error: `The variable "code" must be a string.` });
        if (!(await process.db.invite_codes.get(req.body.code))) return functions.notFound(req, res); // return res.json({ error: `You have provided an invalid invite code.` });

        if (typeof req.body.username !== "string") return res.json({ error: `The variable "username" must be a string.` });
        if (req.body.username.length < 3) return res.json({ error: "The username must be at least 3 characters." });
        if (req.body.username.length > 32) return res.json({ error: "The username cannot be greater than 32 characters." });

        if (typeof req.body.email !== "string") return res.json({ error: `The variable "email" must be a string.` });
        req.body.email = req.body.email.trim().toLowerCase();
        if (!(await functions.validateEmail(req.body.email))) return res.json({ error: `The variable "email" must be an email.` });
        if (req.body.email.length < 3) return res.json({ error: "The email must be at least 3 characters." });
        if (req.body.email.length > 320) return res.json({ error: "The email cannot be greater than 320 characters." });

        if (typeof req.body.password !== "string") return res.json({ error: `The variable "password" must be a string.` });
        if (req.body.password.length < 6) return res.json({ error: "The password must be at least 6 characters." });
        if (req.body.password.length > 72) return res.json({ error: "The password cannot be over 72 characters." });

        if (await process.db.emails_to_ids.get(req.body.email)) return res.json({ error: `There is already an account with the provided email.` });

        let id = await functions.makeid(8);

        if (await process.db.user_info.get(id)) 
            return res.json(
                {
                    error:
                        "A rare error has occured where the account tried to register an account with an already existing ID. " + 
                        "Just click the regiser button again, will ya?"
                }
            );

        if (!(await functions.rateLimitCheck(id, res))) return;

        let token = await functions.makeid(100);
        let password = process.encrypter.test(process.encrypter.password + req.body.password).encrypt(req.body.password);

        await process.db.invite_codes.delete(req.body.code);

        await process.db.passwords.set(id, password);

        let default_pfp_color = default_pfp_colors[Math.floor(Math.random() * default_pfp_colors.length)];

        await process.db.user_info.set(id, {
            token: token,
            username: req.body.username,
            email: req.body.email,
            default_pfp: default_pfp_color,
            avatar_url: null, //link
            verified: false, // verified = email is verified
            mfa_enabled: false, // mfa = mobile 2fa auth verified
        });

        await process.db.tokens_to_ids.set(token, id);
        
        await process.db.emails_to_ids.set(req.body.email, id);

        return res.json({ error: "There are no errors.", id: id, token: token });
    });
};