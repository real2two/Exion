let rate_limits = {};

module.exports = {
    async validateEmail(email) { // https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
        let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },

    async makeid(length) { // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        let result = [];
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
       };
       return result.join('');
    },

    async ifValidAPI(req, res) {
        let auth = req.headers['authorization'];
      
        if (auth) {
            if (auth.startsWith("Bearer ") && auth !== "Bearer ") {
                let given_token = auth.slice("Bearer ".length);
                
                if (await process.db.tokens_to_ids.get(given_token)) return true;
            };
        };
      
        //res.status(403);
        //res.send({ error: "You have provided an invalid token." });

        this.notFoundAPI(req, res);
      
        return false;
    },

    async notFound(req, res) {
        res.status(404);
        res.render("404", {
            req: req
        });
    },

    async notFoundAPI(req, res) {
        res.status(404);
        res.json({ error: "Invalid API endpoint." });
    },

    async rateLimitCheck(id, res) {
        if (rate_limits[id]) {
            res.send({ error: "You are being rate limited." });
            return false;
        };

        rate_limits[id] = true;

        setTimeout(() => {
            delete rate_limits[id]; 
        }, 1000);

        return true;
    },

    async rateLimitCheckWS(id) {
        if (rate_limits[id]) {
            return false;
        };

        rate_limits[id] = true;

        setTimeout(() => {
            delete rate_limits[id]; 
        }, 200);

        return true;
    },

    async rateLimitCheckMessage(id) {
        if (rate_limits[id]) {
            return false;
        };

        rate_limits[id] = true;

        setTimeout(() => {
            delete rate_limits[id]; 
        }, 200);

        return true;
    },
    
    async createID() {
        return `${Date.now()}${Math.floor(Math.random() * 10)}`;
    }
};