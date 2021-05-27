"use strict";

// Hey! Use comments for everything you do.

// Load packages.

require('dotenv').config();
const fs = require("fs"); // Load file manager package.
const express = require("express"); // Loads express (website) package.
const ejs = require("ejs"); // Loads EJS (express addon, used to add backend JS on files) package.
const expressWs = require('express-ws'); // Loads express websocket package.
const encrypter = require('simple-encryptor'); // Loads encryption library.
const Keyv = require("keyv"); // Loads keyv package.
const functions = require("./functions.js"); // Loads custom functions.

// Encryption stuff and password.

// process.encrypter.test("encryption password").encrypt("(not encrypted) text");
// process.encrypter.test("decryption password").decrypt("encrypted text");

process.encrypter = {
  test: encrypter,
  password: process.env.ENCRYPTION_PASSWORD
};

// Loads database.

process.db = { // Makes "process.db" have the database functions.
  emails_to_ids: new Keyv(process.env.DATABASE, {
    table: "emails_to_ids"
  }),

  user_info: new Keyv(process.env.DATABASE, {
    table: "user_info"
  }),

  passwords: new Keyv(process.env.DATABASE, {
    table: "passwords"
  }),

  invite_codes: new Keyv(process.env.DATABASE, {
    table: "invite_codes"
  }),

  tokens_to_ids: new Keyv(process.env.DATABASE, {
    table: "tokens_to_ids"
  }),

  open_dms: new Keyv(process.env.DATABASE, {
    table: "open_dms"
  }),

  messages: new Keyv(process.env.DATABASE, {
    table: "messages"
  }),
};

//process.db.invite_codes.set("code", true);

// Start express website.

const app = express(); // Creates express object.

expressWs(app); // Starts websockets library.

app.use(express.json({
  inflate: true,
  limit: '500kb',
  reviver: null,
  strict: true,
  type: 'application/json',
  verify: undefined
}));

app.use(async (req, res, next) => {
  if (req._parsedUrl.pathname.startsWith("/assets/app/")) {
    let auth = req.headers['authorization'];
      
    if (auth) {
        if (auth.startsWith("Bearer ") && auth !== "Bearer ") {
            let given_token = auth.slice("Bearer ".length);
            
            if (await process.db.tokens_to_ids.get(given_token)) return next();
        };
    };
  
    return functions.notFound(req, res);
  }
  return next();
});

// Sets up EJS.

app.set("view engine", "ejs");
app.set("views", "views");

// Loads files.

const listener = app.listen(process.env.PORT, function() { // Listens the website at a port.
  console.log("[WEBSITE] The application is now listening on port " + listener.address().port + "."); // Message sent when the port is successfully listening and the website is ready.

  app.use('/assets', express.static('./assets'));

  let files = fs.readdirSync('./handlers').filter(file => file.endsWith('.js') && file !== "404.js"); // Gets a list of all files in the "express" folder. Doesn't add any "404.js" to the array.
  files.push("404.js"); // Adds "404.js" to the end of the array. (so it loads last, because it has a "*" request)

  files.forEach(fileName => { // Loops all files in the "handlers" folder.
    let file = require(`./handlers/${fileName}`); // Loads the file.
    file.load(app); // Gives "app" to the file.
  });
});