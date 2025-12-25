function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if(!email || !password) return alert("Fill all fields");

  auth.createUserWithEmailAndPassword(email, password)
    .then(res => {
      // Ekhane 'coins' er jaygay 'balance' likhun
      db.ref("users/" + res.user.uid).set({
        email: email,
        balance: 0, // Balance node use kora holo jate Dashboard-er sathe mile
        createdAt: Date.now()
      });
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}

function login() {
  const email = document.getElementById("li_email").value;
  const password = document.getElementById("li_pass").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => { window.location.href = "dashboard.html"; })
    .catch(err => alert(err.message));
}
