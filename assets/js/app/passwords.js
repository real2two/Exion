async function changePassword() {
    let email = userinfo.email;
    let old_password = document.getElementById("changePasswordOldPassword").value;
    let new_password = document.getElementById("changePasswordNewPassword").value;

    let testLogin = await fetch("/update_password", {
        method: "POST",
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            email: email,
            old_password: old_password,
            new_password: new_password
        })
    });

    let account = await testLogin.json();
    let error = account.error;

    let errordiv = document.getElementById("changePasswordError");
    errordiv.style.display = "block";
    errordiv.innerHTML = error;
};