let current_channel;

function gotoDMs() {
    let id = document.getElementById("userid").value;

    sendWS({
        action: "openDM",
        id: id
    });
};

function openDMs(id) {
    sendWS({
        action: "openDM",
        id: id
    });
};