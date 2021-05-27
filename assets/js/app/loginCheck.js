let token = getCookie("token");

checkLoggedIn();

async function checkLoggedIn() {
    if (!token) {
        setCookie("token", "");
        return window.location.href = "/login";
    };

    let checkToken = await fetch("/api/token", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    let res = await checkToken.json();

    //if (res.error == "You have provided an invalid token.") {
    if (res.error == "Invalid API endpoint.") {
        setCookie("token", "");
        return window.location.href = "/login";
    };

    // Successful!

    loadWS();
};