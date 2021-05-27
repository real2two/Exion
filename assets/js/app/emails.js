async function changeEmail() {
    let old_email = userinfo.email;
    let new_email = document.getElementById("changeEmailNewEmail").value;
    let password = document.getElementById("changeEmailPassword").value;

    let testLogin = await fetch("/update_email", {
        method: "POST",
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            old_email: old_email,
            new_email: new_email,
            password: password
        })
    });

    let account = await testLogin.json();
    let error = account.error;

    let errordiv = document.getElementById("changeEmailError");
    errordiv.style.display = "block";
    errordiv.innerHTML = error;

    if (error == "Successfully changed your email!") userinfo.email = new_email;
};

function toggleEmail(event) {
    if (event.target.innerHTML == "Show") {
        event.target.innerHTML = "Hide";
        document.getElementById("email").innerHTML = userinfo.email;
    } else { // Hide
        event.target.innerHTML = "Show";
        document.getElementById("email").innerHTML = hideEmail(userinfo.email);
    };
};

// https://stackoverflow.com/questions/52154300/partially-hide-email-address-with-regex-and-javascript/52154344
let hideEmail = function(email) {
    return email.replace(/(.{0})(.*)(?=@)/,
        function(gp1, gp2, gp3) { 
            for (let i = 0; i < gp3.length; i++) { 
                gp2+= "*"; 
            } return gp2; 
        });
};