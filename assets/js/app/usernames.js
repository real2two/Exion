async function changeUsername() {
    let username = document.getElementById("changeUsernameUsername").value;

    sendWS({
        action: "changeUsername",
        username: username
    });
};