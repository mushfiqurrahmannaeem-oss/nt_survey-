// withdraw.js

// 1. Auth and Balance Loading Logic
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("Logged in as:", user.email); //
        
        // Database theke balance load kora (Direct call to avoid 'db' redeclaration error)
        firebase.database().ref("users/" + user.uid + "/balance").on("value", (snapshot) => {
            const balance = snapshot.val() || 0;
            
            // withdraw.html er ID 'coins'
            const coinDisplay = document.getElementById("coins");
            if (coinDisplay) {
                coinDisplay.innerText = balance;
            }
        });
    } else {
        window.location.href = "index.html";
    }
});

// 2. Withdraw Request Function
function requestWithdraw() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please login first!");
        return;
    }

    // HTML input field gulo sothik ID diye dhora
    // Apnar HTML e 'wd_coins' ache, tai oitai main preference
    const amountField = document.getElementById("wd_coins") || document.getElementById("wd_amount");
    const methodField = document.getElementById("wd_method");
    const accountField = document.getElementById("wd_account");

    // Check kora jeno field gulo khunje pay
    if (!amountField || !methodField || !accountField) {
        console.error("Input fields not found! Check your HTML IDs.");
        alert("Error: Form fields missing in HTML.");
        return;
    }

    const amount = parseInt(amountField.value);
    const method = methodField.value;
    const account = accountField.value;

    // Validation logic
    if (!amount || amount < 500) {
        alert("Minimum withdrawal is 500 coins!");
        return;
    }

    if (!account) {
        alert("Please enter your account or wallet address!");
        return;
    }

    // User-er current balance check kora
    const balanceRef = firebase.database().ref("users/" + user.uid + "/balance");
    
    balanceRef.once("value").then((snapshot) => {
        const currentBalance = snapshot.val() || 0;

        if (currentBalance < amount) {
            alert("Insufficient balance! You have only " + currentBalance + " coins.");
            return;
        }

        // Database-e withdraw request pathano
        const requestData = {
            uid: user.uid,
            email: user.email,
            amount: amount,
            method: method,
            account: account,
            status: "pending", 
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // 'withdraw_requests' node-e data push kora (Ensure Rules are set to auth != null)
        firebase.database().ref("withdraw_requests").push(requestData)
            .then(() => {
                // Request success hole user-er balance minus kora
                const newBalance = currentBalance - amount;
                balanceRef.set(newBalance).then(() => {
                    alert("Success! Your withdraw request is pending.");
                    
                    // Form khali kora
                    amountField.value = "";
                    accountField.value = "";
                });
            })
            .catch((error) => {
                // Jodi ekhono 'Permission Denied' ashe, tobe Firebase Rules check koren
                alert("Database Error: " + error.message);
            });
    });
}
