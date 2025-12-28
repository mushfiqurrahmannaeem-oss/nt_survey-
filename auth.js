function signup() {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!email || !password) {
    alert("Email & Password লাগবে");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(res => {
      db.ref("users/" + res.user.uid).set({
        email: email,
        balance: 0,
        createdAt: Date.now()
      });
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}

function login() {
  const email = document.getElementById("li_email").value.trim();
  const password = document.getElementById("li_pass").value.trim();

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}