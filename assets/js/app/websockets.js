let ws;
let userinfo;
let open_dms;
let other_userinfo = {};
let cachemessages = [];

function loadWS() {
    let scheme = "ws";

    if (document.location.protocol === "https:") scheme += "s";

    ws = new WebSocket(`${scheme}://${document.location.hostname}:${location.port}/api/ws`, token);

    ws.onopen = async function(evt) {
        console.log("[WEBSOCKET] Successfully connected.");

        setInterval(() => { sendWS("ping"); }, 5000);
        
        ws.onmessage = async function(evt) {
            let res = JSON.parse(evt.data);

            switch (res.replyTo) {
                case "load":
                    userinfo = res.userinfo;
                    open_dms = res.open_dms;

                    for (let dm of open_dms) {
                        other_userinfo[dm.id] = dm;

                        document.getElementById("dms").innerHTML = document.getElementById("dms").innerHTML + 
                            `<div class="chats-sidebar-item chats-sidebar-item-unselected" id="dm_${dm.id}" onclick="loadPage('messages', event.currentTarget, '${dm.id}');"); // Placeholder">
                                <img src="${dm.avatar}">
                                <div class="chats-sidebar-item-text">
                                    <h3>${dm.name}</h3>
                                    <p class="color-grey mt-4">${dm.last_message}</p>
                                </div>
                            </div>`;
                    };
                    
                    let dm_doc = document.getElementById(first_user_id ? "dm_" + first_user_id : first_option);
                    await loadPage(dm_doc ? first_option : "account", dm_doc || document.getElementById("account"), dm_doc ? first_user_id : undefined);

                    break;
                
                case "changeUsername":
                    if (res.error == "Successfully changed your username!" || res.error == null) {
                        userinfo.username = res.username;
                    };
                    
                    if (option == "account") {
                        let errordiv = document.getElementById("changeUsernameError");
                        errordiv.style.display = "block";
                        errordiv.innerHTML = res.error;
                        
                        if (res.error == "Successfully changed your username!") document.getElementById("username").innerHTML = res.username;
                    };

                    break;

                case "newOpenDMs":
                    open_dms = res.open_dms;

                    document.getElementById("dms").innerHTML = "";

                    for (let dm of open_dms) {
                        document.getElementById("dms").innerHTML = document.getElementById("dms").innerHTML + 
                            `<div class="chats-sidebar-item chats-sidebar-item-unselected" id="dm_${dm.id}" onclick="loadPage('messages', event.currentTarget, '${dm.id}');"); // Placeholder">
                                <img src="${dm.avatar}">
                                <div class="chats-sidebar-item-text">
                                    <h3>${dm.name}</h3>
                                    <p class="color-grey mt-4">${dm.last_message}</p>
                                </div>
                            </div>`;
                    };

                    break;

                case "emailChange":
                    userinfo.email = res.email;

                    if (option == "account") document.getElementById("email").innerHTML = document.querySelectorAll(".email-reveal")[0].innerHTML == "Show" ? userinfo.email : hideEmail(userinfo.email);

                    break;

                case "openDM":
                    let error = res.error;

                    if (error == "Successfully opened DMS!" || error == "You already have this DM open.") {

                        if (error == "Successfully opened DMS!") {
                            if (!document.getElementById(`dm_${res.DMinfo.id}`)) {
                                open_dms.push(res.DMinfo);
    
                                document.getElementById("dms").innerHTML = document.getElementById("dms").innerHTML + 
                                    `<div class="chats-sidebar-item chats-sidebar-item-unselected" id="dm_${res.DMinfo.id}" onclick="loadPage('messages', event.currentTarget, '${res.DMinfo.id}');"); // Placeholder">
                                        <img src="${res.DMinfo.avatar}">
                                        <div class="chats-sidebar-item-text">
                                            <h3>${res.DMinfo.name}</h3>
                                            <p class="color-grey mt-4">${res.DMinfo.last_message}</p>
                                        </div>
                                    </div>`;
                            };  
                        };

                        // There is no error functions here.

                        if (option !== "messages") {
                            loadPage("messages", document.getElementById(`dm_${res.DMinfo.id}`), res.DMinfo.id);

                        } else {
                            if (error == "Successfully opened DMS!") {
                                /*
                                cachemessages = [];

                                for (let msg of res.messages) {
                                    cachemessages.push(msg);

                                    document.getElementById("messages").innerHTML = document.getElementById("messages").innerHTML + 
                                        `<div class="chat-message">
                                            <img src="${msg.id == userinfo.id ? (userinfo.avatar_url || `/assets/img/avatars/${userinfo.default_pfp}.png`) : other_userinfo[msg.id].avatar}">
                                            <div>
                                                <div class="chat-bubble${msg.id == userinfo.id ? "" : " bg-grey"}">
                                                    ${msg.raw}
                                                </div>
                                                <p class="color-grey mt-10"><b class="color-grey">${msg.id == userinfo.id ? userinfo.username : other_userinfo[msg.id].name}</b>${msg.id == userinfo.id ? " • Delete" : ""}</p>
                                            </div>
                                        </div>`;
                                };
                                */
                            } else { // error == "You already have this DM open."
                                for (let msg of cachemessages) {
                                    document.getElementById("messages").innerHTML = document.getElementById("messages").innerHTML + 
                                        `<div id="msgdiv_${res.message_id}">
                                            <div class="chat-message">
                                                <img src="${msg.id == userinfo.id ? (userinfo.avatar_url || `/assets/img/avatars/${userinfo.default_pfp}.png`) : other_userinfo[msg.id].avatar}">
                                                <div>
                                                    <div class="chat-bubble bg${msg.id == userinfo.id ? "" : " bg-grey"}">
                                                        ${textParser(msg.raw)}
                                                    </div>
                                                    <p class="color-grey mt-10"><b class="color-grey">${msg.id == userinfo.id ? userinfo.username : other_userinfo[msg.id].name}</b>${msg.id == userinfo.id ? ` • <span class="delete-message" onclick="deleteMessage('${msg.message_id}');">Delete</span>` : ""}</p>
                                                </div>
                                            </div>
                                        </div>`;
                                };
                            };
                        };

                    } else {
                        document.getElementById("peopleError").innerHTML = error;
                    };

                    break;

                case "sendMessage":
                    if (res.error == "You are being rate limited.") {
                        sendMessageWS(res.given);
                    };

                    break;

                case "deletedMessage":
                    cachemessages = cachemessages.filter(m => m.message_id.toString() !== res.message_id.toString());

                    let messagediv = document.getElementById("msgdiv_" + res.message_id);

                    if (messagediv) messagediv.remove();

                    break;

                case "oldMessage":
                    //if (option !== "messages") return;
                    if (!current_channel) return;
                    if (res.type !== current_channel.type) return;
                    let which_dm = res.channel.filter(u => u !== userinfo.id)[0];
                    if (which_dm !== current_channel.id) return;

                    delete res.replyTo;

                    cachemessages.unshift(res);

                    if (option == "messages") {
                        document.getElementById("messages").innerHTML = 
                            `<div id="msgdiv_${res.message_id}">
                                <div class="chat-message">
                                    <img src="${res.id == userinfo.id ? (userinfo.avatar_url || `/assets/img/avatars/${userinfo.default_pfp}.png`) : other_userinfo[res.id].avatar}">
                                    <div>
                                        <div class="chat-bubble${res.id == userinfo.id ? "" : " bg-grey"}">
                                            ${textParser(res.raw)}
                                        </div>
                                        <p class="color-grey mt-10"><b class="color-grey">${res.id == userinfo.id ? userinfo.username : other_userinfo[res.id].name}</b>${res.id == userinfo.id ? ` • <span class="delete-message" onclick="deleteMessage('${res.message_id}');">Delete</span>` : ""}</p>
                                    </div>
                                </div>
                            </div>` + document.getElementById("messages").innerHTML;
                    };

                    break;

                case "newMessage":
                    //if (option !== "messages") return;
                    if (!current_channel) return;
                    if (res.type !== current_channel.type) return;
                    let which__dm = res.channel.filter(u => u !== userinfo.id)[0];
                    if (which__dm !== current_channel.id) return;

                    delete res.replyTo;

                    cachemessages.push(res);

                    if (option == "messages") {
                        document.getElementById("messages").innerHTML = document.getElementById("messages").innerHTML + 
                            `<div id="msgdiv_${res.message_id}">
                                <div class="chat-message">
                                    <img src="${res.id == userinfo.id ? (userinfo.avatar_url || `/assets/img/avatars/${userinfo.default_pfp}.png`) : other_userinfo[res.id].avatar}">
                                    <div>
                                        <div class="chat-bubble${res.id == userinfo.id ? "" : " bg-grey"}">
                                            ${textParser(res.raw)}
                                        </div>
                                        <p class="color-grey mt-10"><b class="color-grey">${res.id == userinfo.id ? userinfo.username : other_userinfo[res.id].name}</b>${res.id == userinfo.id ? ` • <span class="delete-message" onclick="deleteMessage('${res.message_id}');">Delete</span>` : ""}</p>
                                    </div>
                                </div>
                            </div>`;
                    };

                    break;
            }
        };

        ws.onclose = function(evt) {
            console.log("[WEBSOCKET] The websocket has disconnected.");

            location.reload(); //window.location.href = "/"; // Temporary.
        };
    };
};

let wsToSend = [];

function sendWS(content) {
    wsToSend.push(content);
};

setInterval(() => {
    if (!userinfo) return;

    if (wsToSend.length == 0) return;

    ws.send(JSON.stringify(wsToSend.shift()));
}, 200);

let wsMessageToSend = [];

function sendMessageWS(content) {
    wsMessageToSend.push(content);
};

setInterval(() => {
    if (!userinfo) return;

    if (wsMessageToSend.length == 0) return;

    ws.send(JSON.stringify(wsMessageToSend.shift()));
}, 200);
