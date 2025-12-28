firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        location.href = "index.html";
        return;
    }

    firebase.database()
      .ref("users/" + user.uid + "/balance")
      .on("value", snap => {
          document.getElementById("coins").innerText = snap.val() || 0;
      });
});

function requestWithdraw() {
    const user = firebase.auth().currentUser;

    const amount = parseInt(document.getElementById("wd_coins").value);
    const method = document.getElementById("wd_method").value;
    const account = document.getElementById("wd_account").value;

    if (!amount || amount < 500) {
        alert("Minimum withdraw 500 coins");
        return;
    }

    if (!account) {
        alert("Enter account / wallet");
        return;
    }

    const balanceRef = firebase.database().ref("users/" + user.uid + "/balance");

    balanceRef.once("value").then(snap => {
        const balance = snap.val() || 0;

        if (balance < amount) {
            alert("Insufficient balance");
            return;
        }

        const data = {
            uid: user.uid,
            email: user.email,
            amount,
            method,
            account,
            status: "pending",
            timestamp: Date.now()
        };

        firebase.database().ref("withdraw_requests").push(data)
        .then(() => {
            balanceRef.set(balance - amount);
            alert("Withdraw request submitted");
            document.getElementById("wd_coins").value = "";
            document.getElementById("wd_account").value = "";
        });
    });
}