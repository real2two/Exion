if (getCookie("token")) window.location.href = "/app";

async function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    let testLogin = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    let account = await testLogin.json();
    let error = account.error;

    if (error == "There are no errors.") {
        setCookie("token", account.token);
        document.location.href = "/app";
    } else {
        let errordiv = document.getElementById("error");
        errordiv.style.display = "block";
        errordiv.innerHTML = error;
    };
};

// https://www.w3schools.com/js/js_cookies.asp

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    };
    return "";
};

function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 *1000 ));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
};