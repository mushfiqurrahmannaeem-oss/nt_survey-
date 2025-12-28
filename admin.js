/*********************************
 * ADMIN LOGIN
 *********************************/
function adminLogin() {
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    if (!email || !password) {
        alert("Email & Password required!");
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((res) => {
            const uid = res.user.uid;

            // 🔐 Admin check (Realtime Database)
            firebase.database().ref("admins/" + uid).once("value")
                .then((snap) => {
                    if (snap.exists() && snap.val().role === "admin") {
                        alert("Admin Login Successful!");

                        document.getElementById("loginSection").style.display = "none";
                        document.getElementById("adminDashboard").style.display = "block";

                        loadAdminSurveys();
                        loadWithdrawRequests();
                    } else {
                        alert("Access Denied! You are not an admin.");
                        firebase.auth().signOut();
                    }
                });
        })
        .catch(err => alert(err.message));
}


/*********************************
 * PUBLISH SURVEY
 *********************************/
function publishSurvey() {
    const title = document.getElementById("surveyTitle").value;
    const desc = document.getElementById("surveyDesc").value;
    const reward = document.getElementById("rewardCoins").value;
    const link = document.getElementById("surveyLink").value;
    const targetGroup = document.getElementById("targetGroup").value;

    if (!title || !desc || !reward || !link) {
        alert("Please fill all fields!");
        return;
    }

    const surveyData = {
        title: title,
        desc: desc,
        reward: parseInt(reward),
        link: link,
        target_group: targetGroup,
        timestamp: Date.now()
    };

    firebase.database().ref("surveys").push(surveyData)
        .then(() => {
            alert("Survey Published Successfully!");

            document.getElementById("surveyTitle").value = "";
            document.getElementById("surveyDesc").value = "";
            document.getElementById("rewardCoins").value = "";
            document.getElementById("surveyLink").value = "";
        })
        .catch(err => alert(err.message));
}


/*********************************
 * LOAD ADMIN SURVEYS
 *********************************/
function loadAdminSurveys() {
    const listDiv = document.getElementById("adminSurveyList");
    if (!listDiv) return;

    firebase.database().ref("surveys").on("value", (snapshot) => {
        listDiv.innerHTML = "";

        if (!snapshot.exists()) {
            listDiv.innerHTML = "<p style='text-align:center;color:gray;'>No surveys published.</p>";
            return;
        }

        snapshot.forEach(child => {
            const data = child.val();
            const key = child.key;

            let badgeColor =
                data.target_group === "HighCPM" ? "#d35400" :
                data.target_group === "Others" ? "#6c757d" : "#007bff";

            const div = document.createElement("div");
            div.style = "background:#fff;padding:15px;margin-bottom:15px;border-radius:12px;border:1px solid #ddd;";

            div.innerHTML = `
                <span style="float:right;background:${badgeColor};color:#fff;font-size:10px;padding:3px 8px;border-radius:10px;">
                    ${data.target_group || "Global"}
                </span>

                <h4>${data.title}</h4>

                <div class="survey-desc">${data.desc}</div>

                <p style="color:green;font-weight:bold;">💰 ${data.reward} Coins</p>

                <button onclick="deleteSurvey('${key}')"
                    style="width:100%;background:#ff4757;color:white;border:none;padding:10px;border-radius:8px;">
                    Delete Survey
                </button>
            `;
            listDiv.appendChild(div);
        });
    });
}


/*********************************
 * DELETE SURVEY
 *********************************/
function deleteSurvey(key) {
    if (confirm("Are you sure you want to delete this survey?")) {
        firebase.database().ref("surveys/" + key).remove();
    }
}


/*********************************
 * LOAD WITHDRAW REQUESTS
 *********************************/
function loadWithdrawRequests() {
    const listDiv = document.getElementById("pendingList");
    if (!listDiv) return;

    firebase.database().ref("withdraw_requests").on("value", (snap) => {
        listDiv.innerHTML = "";

        if (!snap.exists()) {
            listDiv.innerHTML = "<p style='text-align:center;'>No pending requests.</p>";
            return;
        }

        snap.forEach(child => {
            const data = child.val();
            const key = child.key;

            if (data.status === "pending") {
                const card = document.createElement("div");
                card.style = "border:1px solid #ddd;padding:15px;margin-top:10px;border-radius:12px;background:#fff;";

                card.innerHTML = `
                    <p><b>Email:</b> ${data.email}</p>
                    <p><b>Amount:</b> ${data.amount} Coins</p>
                    <p><b>Method:</b> ${data.method}</p>

                    <button onclick="updateWithdrawStatus('${key}','approved')"
                        style="background:green;color:white;padding:6px 10px;border:none;border-radius:6px;">
                        Approve
                    </button>

                    <button onclick="updateWithdrawStatus('${key}','rejected')"
                        style="background:red;color:white;padding:6px 10px;border:none;border-radius:6px;">
                        Reject
                    </button>

                    <button onclick="inspectUser('${data.uid}')"
                        style="background:#007bff;color:white;padding:6px 10px;border:none;border-radius:6px;">
                        Inspect
                    </button>
                `;
                listDiv.appendChild(card);
            }
        });
    });
}


/*********************************
 * UPDATE WITHDRAW STATUS
 *********************************/
function updateWithdrawStatus(key, status) {
    firebase.database().ref("withdraw_requests/" + key + "/status").set(status);
}


/*********************************
 * INSPECT USER
 *********************************/
function inspectUser(uid) {
    firebase.database().ref("users/" + uid).once("value")
        .then(snap => {
            if (!snap.exists()) {
                alert("User not found!");
                return;
            }

            const u = snap.val();
            const completed = u.completed_surveys ? Object.keys(u.completed_surveys).length : 0;

            alert(
                `USER INFO\n\nEmail: ${u.email}\nBalance: ${u.balance}\nCompleted Surveys: ${completed}`
            );
        });
}