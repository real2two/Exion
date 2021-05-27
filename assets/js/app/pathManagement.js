let option;

let oldoption;

async function loadPage(path, doc, userid) {
    let loadOption = await fetch(`/assets/app/${path}.html`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    let html = await loadOption.text();

    document.getElementById("html").innerHTML = html;

    window.history.pushState({ html: html, pageTitle: document.title }, "", "/app/" + path + (path == "messages" && userid ? `/${userid}` : ""));

    if (oldoption) oldoption.className = `chats-sidebar-item chats-sidebar-item-unselected`;

    if (doc) doc.className = `chats-sidebar-item chats-sidebar-item-selected`;

    oldoption = doc;

    option = path;

    if (path == "account") { // Account page.
        document.getElementById("userID").innerHTML = userinfo.id;
        document.getElementById("username").innerHTML = userinfo.username;
        document.getElementById("email").innerHTML = hideEmail(userinfo.email);
        document.getElementById("token").innerHTML = token;
    };

    if (path == "messages" && userid) {
        current_channel = {
            type: "user",
            id: userid
        };

        openDMs(userid);
    };
    
};

// https://stackoverflow.com/questions/824349/how-do-i-modify-the-url-without-reloading-the-page

window.onpopstate = function(e) {
    if (e.state) {
        document.getElementById("html").innerHTML = e.state.html;
        document.title = e.state.pageTitle;
    };
};