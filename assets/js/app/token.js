async function regenerateToken() {
    let email = userinfo.email;
    let password = document.getElementById("regenerateTokenPassword").value;

    let testLogin = await fetch("/regen", {
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
        document.location.reload();
    } else {
        let errordiv = document.getElementById("regenError");
        errordiv.style.display = "block";
        errordiv.innerHTML = error;
    };
}