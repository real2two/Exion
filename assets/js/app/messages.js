function sendMessage(id, content) {
    if (content.length == 0) return;
    if (content.length > 10000) return;

    sendWS({
        action: "sendMessage",
        send_user_id: id,
        raw: content.trim().replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"),
        attachments: null
    });
}

function deleteMessage(id) {
    sendWS({
        action: "deleteMessage",
        send_user_id: current_channel.id,
        message_id: id
    });
}

document.body.addEventListener("keydown", function (event) {
    if (event.target.id !== "content") return;

    if (event.keyCode == 13 && !event.shiftKey) {
        event.preventDefault();
    };
});

document.body.addEventListener("keyup", function (event) {
    if (event.target.id !== "content") return;

    if (event.keyCode == 13 && !event.shiftKey) {
        event.preventDefault();

        let text = event.target.innerHTML.trim().replace(/<br>/g, "\n").replace(/(<([^>]+)>)/gi, "");

        if (text.length == 0) return;

        sendMessage(current_channel.id, text);

        event.target.innerHTML = "";
    };
});

document.body.addEventListener("paste", event => {
    if (event.target.id !== "content") return;

    event.preventDefault();

    document.execCommand("insertHTML", false,
        ((event.originalEvent || event).clipboardData.getData('text/plain')) // text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") // remove html encoding
    );
});