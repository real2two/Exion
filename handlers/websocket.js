const functions = require("../functions.js");

let all_ws = [];

module.exports.load = async function(app) {
    app.ws("/api/ws", async (ws, req) => {
        let token = req.headers["sec-websocket-protocol"];

        if (!token) return ws.terminate();
        if (token.length !== 100) return ws.terminate();
        
        let id = await process.db.tokens_to_ids.get(token);
        if (!id) return ws.terminate();

        all_ws.push([id, ws]);

        let userinfo = await process.db.user_info.get(id);
        let open_dms = await process.db.open_dms.get(id) || [];

        let opennewdm = null;

        let old_open_dms = await sendAllOpenDMS();

        userinfo.id = id;
        delete userinfo.token;

        async function sendAllOpenDMS() {
            /*
                {
                    type: "user",
                    id: userinfo.id
                }
            */

            let all_dms = [];

            for (let dm of open_dms) {
                if (dm.type == "user") {
                    let dm_userinfo = await process.db.user_info.get(dm.id);

                    let id = dm.id;
                    let name = dm_userinfo.username;
                    let avatar = dm_userinfo.avatar_url || `/assets/img/avatars/${dm_userinfo.default_pfp}.png`;

                    all_dms.push({
                        id: id,
                        name: name,
                        avatar: avatar,
                        last_message: "ID: " + dm.id
                    })
                };
            };
            
            return all_dms;
        };

        sendWS({
            replyTo: "load",
            userinfo: userinfo,
            open_dms: old_open_dms
        });

        let tokenCheck = setInterval(async () => {
            let olduserinfo = Object.assign({}, userinfo);

            let newuserinfo = await process.db.user_info.get(id);

            if (token !== newuserinfo.token) {
                clearInterval(tokenCheck);
                return ws.close();
            };

            newuserinfo.id = id;
            delete newuserinfo.token;

            userinfo = newuserinfo;

            if (newuserinfo.username !== olduserinfo.username) sendWS({
                replyTo: "changeUsername",
                error: null,
                username: userinfo.username
            });

            if (userinfo.email !== olduserinfo.email) sendWS({
                replyTo: "emailChange",
                email: userinfo.email
            });

            open_dms = await process.db.open_dms.get(id) || [];
            let rendered_open_dms = await sendAllOpenDMS();

            if (JSON.stringify(rendered_open_dms) !== JSON.stringify(old_open_dms)) {
                old_open_dms = await sendAllOpenDMS();
                
                sendWS({
                    replyTo: "newOpenDMs",
                    open_dms: old_open_dms
                });
            };

        }, 5000); // I hope this doesn't kill the database.

        ws.on('message', async function(res) {
            /* Removed since it would do even more unnecessary database queries:
            
            Token Checking #2

            let newuserinfo = await process.db.user_info.get(id);

            if (token !== newuserinfo.token) {
                clearInterval(tokenCheck);
                return ws.close();
            };

            newuserinfo.id = id;
            delete newuserinfo.token;

            ---

            */
            
            let json;

            try {
                json = JSON.parse(res);
            } catch(err) {
                return;
            };

            if (typeof json.action !== "string") return;

            if (!(await functions.rateLimitCheckWS(userinfo.id))) return sendWS({ replyTo: json.action, error: "You are being rate limited." });
            
            switch (json.action) {
                case "changeUsername":
                    if (typeof json.username !== "string") return sendWS({ replyTo: json.action, error: `The variable "username" must be a string.` });
                    if (json.username.length < 3) return sendWS({ replyTo: json.action, error: "The username must be at least 3 characters." });
                    if (json.username.length > 32) return sendWS({ replyTo: json.action, error: "The username cannot be greater than 32 characters." });
            
                    if (userinfo.username == json.username) return sendWS({ replyTo: json.action, error: "The new username you provided is the same as your current username." });

                    let realuserinfo = await process.db.user_info.get(userinfo.id); // Because token.

                    realuserinfo.username = json.username;
                    delete realuserinfo.id;
            
                    await process.db.user_info.set(userinfo.id, realuserinfo);

                    userinfo.username = json.username;
            
                    sendWS({ replyTo: json.action, error: "Successfully changed your username!", username: json.username });

                    break;

                case "openDM":
                    if (typeof json.id !== "string") return sendWS({ replyTo: json.action, error: "The user ID must be a string." });
                    if (json.id.length !== 8) return sendWS({ replyTo: json.action, error: "Invalid user ID." });

                    if (json.id == userinfo.id) return sendWS({ replyTo: json.action, error: "You cannot open a self-DM." });

                    let userDMtoOpen = await process.db.user_info.get(json.id);

                    if (!userDMtoOpen) return sendWS({ replyTo: json.action, error: "Invalid user ID." });

                    let update_open_dms = {
                        user: false,
                        other_user: false
                    };

                    open_dms = await process.db.open_dms.get(userinfo.id) || [];
                    let other_user_open_dms = await process.db.open_dms.get(json.id) || [];

                    let storage_id;

                    let user_open_dms_check = open_dms.filter(dm => dm.type == "user" && dm.id == json.id);
                    let other_user_open_dms_check = other_user_open_dms.filter(dm => dm.type == "user" && dm.id == userinfo.id);

                    if (user_open_dms_check.length == 0 && other_user_open_dms_check.length == 0) {
                        storage_id = await functions.createID();
                    } else {
                        if (user_open_dms_check[0]) {
                            storage_id = user_open_dms_check[0].storage_id;
                        } else {
                            storage_id = other_user_open_dms_check[0].storage_id;
                        };
                    };

                    if (user_open_dms_check.length == 0) {
                        update_open_dms.user = true;

                        open_dms.push({
                            type: "user",
                            id: json.id,
                            storage_id: storage_id
                        });
                    };

                    if (other_user_open_dms_check.length == 0) {
                        update_open_dms.other_user = true;

                        other_user_open_dms.push({
                            type: "user",
                            id: userinfo.id,
                            storage_id: storage_id
                        });
                    };

                    if (open_dms.length > 100) return sendWS({ replyTo: json.action, error: "Too many DMs are open." }); // Temporary
                    if (other_user_open_dms.length > 100) return sendWS({ replyTo: json.action, error: "The requested user to DM has too many DMs open currently." }); // Temporary

                    if (opennewdm) if (opennewdm == json.id) return sendWS({ replyTo: json.action, error: "You already have this DM open." });

                    opennewdm = json.id;

                    if (update_open_dms.user) await process.db.open_dms.set(userinfo.id, open_dms);
                    if (update_open_dms.other_user) await process.db.open_dms.set(json.id, other_user_open_dms);

                    // Do DMs stuff here.

                    sendWS({
                        replyTo: json.action,
                        error: "Successfully opened DMS!",
                        DMinfo: {
                            id: json.id,
                            name: userDMtoOpen.username,
                            avatar: userDMtoOpen.avatar_url || `/assets/img/avatars/${userDMtoOpen.default_pfp}.png`,
                            last_message: "ID: " + json.id
                        },
                        //messages: [] // messages
                    });

                    let message_count = await process.db.messages.get(storage_id) || 0;
                    let i = 0;

                    while (message_count - i > 0) { // && i < 50
                        if (opennewdm !== json.id) return;
                        let message = await process.db.messages.get(storage_id + "-" + (message_count - i));
                        if (opennewdm !== json.id) return;
                        if (message) {
                            sendWS({
                                message_id: message_count - i,
                                replyTo: "oldMessage",
                                type: "user",
                                channel: [userinfo.id, json.id],
                                id: message.id,
                                raw: message.raw,
                                attachments: null
                            });
                        };
                        i++;
                    };

                    break;

                case "sendMessage":
                    if (typeof json.send_user_id !== "string") return sendWS({ replyTo: json.action, error: "send_user_id must be a string." });
                    if (json.send_user_id == userinfo.id) return sendWS({ replyTo: json.action, error: "You cannot self-DM yourself." });
                    if (!(await process.db.user_info.get(json.send_user_id))) return sendWS({ replyTo: json.action, error: "You have provided an invalid user ID." });

                    open_dms = await process.db.open_dms.get(userinfo.id) || [];

                    let open_dms_check = open_dms.filter(dm => dm.type == "user" && dm.id == json.send_user_id);

                    if (open_dms_check.length == 0) return sendWS({ replyTo: json.action, error: "You do not have DMs open with the user with the provided user ID." });

                    // Do checking if the user is blocked the user and if they have DMs open with the person.

                    if (typeof json.raw !== "string") return sendWS({ replyTo: json.action, error: "The raw message must be a string." });
                    
                    json.raw = json.raw.trim();

                    if (json.raw.length == 0) return sendWS({ replyTo: json.action, error: "The raw message cannot be empty." });
                    if (json.raw.length > 2000) return sendWS({ replyTo: json.action, error: "The raw message cannot be over 2000 characters." });

                    if (json.attachments !== null) return sendWS({ replyTo: json.action, error: "You cannot send attachments with Exion yet." }); // Placeholder.

                    if (!(await functions.rateLimitCheckMessage(open_dms_check[0].storage_id))) return sendWS({ replyTo: json.action, error: "You are being rate limited.", given: json });

                    let messageCount = await process.db.messages.get(open_dms_check[0].storage_id) || 0;

                    messageCount++;

                    await process.db.messages.set(open_dms_check[0].storage_id, messageCount);

                    await process.db.messages.set(open_dms_check[0].storage_id + "-" + messageCount, {
                        id: userinfo.id,
                        raw: json.raw,
                        attachments: null // Placeholder
                    });

                    sendWS({
                        replyTo: json.action,
                        error: "Success!"
                    });

                    // Sent message event using WS.

                    for (let ws of all_ws) {
                        if (ws[0] == userinfo.id || ws[0] == json.send_user_id) {
                            ws[1].send(JSON.stringify({
                                message_id: messageCount,
                                replyTo: "newMessage",
                                type: "user",
                                channel: [userinfo.id, json.send_user_id],
                                id: userinfo.id,
                                raw: json.raw,
                                attachments: null
                            }));
                        };
                    };

                    break;

                case "deleteMessage":
                    if (typeof json.send_user_id !== "string") return sendWS({ replyTo: json.action, error: "send_user_id must be a string." });
                    if (json.send_user_id == userinfo.id) return sendWS({ replyTo: json.action, error: "You cannot self-DM yourself." });
                    if (!(await process.db.user_info.get(json.send_user_id))) return sendWS({ replyTo: json.action, error: "You have provided an invalid user ID." });

                    open_dms = await process.db.open_dms.get(userinfo.id) || [];

                    let open_dms_check_2 = open_dms.filter(dm => dm.type == "user" && dm.id == json.send_user_id);

                    if (open_dms_check_2.length == 0) return sendWS({ replyTo: json.action, error: "You do not have DMs open with the user with the provided user ID." });

                    if (typeof json.message_id !== "string") return sendWS({ replyTo: json.action, error: "message_id must be a string." });

                    let message = await process.db.messages.get(open_dms_check_2[0].storage_id + "-" + json.message_id);

                    if (!message) return sendWS({ replyTo: json.action, error: "Cannot find message." });

                    if (message.id !== userinfo.id) return sendWS({ replyTo: json.action, error: "You cannot delete a message you didn't send." });

                    await process.db.messages.delete(open_dms_check_2[0].storage_id + "-" + json.message_id);

                    sendWS({
                        replyTo: json.action,
                        error: "Success!"
                    });

                    for (let ws of all_ws) {
                        if (ws[0] == userinfo.id || ws[0] == json.send_user_id) {
                            ws[1].send(JSON.stringify({
                                message_id: json.message_id,
                                replyTo: "deletedMessage",
                                type: "user",
                                channel: [userinfo.id, json.send_user_id]
                            }));
                        };
                    };

                    break;

                default:
                    sendWS({
                        replyTo: json.action,
                        error: "Invalid action."
                    });

                    break;
            };

            //sendWS(JSON.stringify(json));
        });

        function sendWS(text) {
            if (ws.readyState == 1) {
                ws.send(JSON.stringify(text));
                return true;
            } else {
                return false;
            };
        };

        ws.onclose = () => {
            all_ws = all_ws.filter(test_ws => test_ws[1] !== ws);
        };

    });
};