// 1. Admin Login Logic
function adminLogin() {
    const emailInput = document.getElementById("adminEmail");
    const passInput = document.getElementById("adminPassword");

    if (!emailInput || !passInput) return;

    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (email === "" || password === "") {
        alert("Please fill in both fields!");
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
        alert("Admin Login Successful!");
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("adminDashboard").style.display = "block";
        
        loadAdminSurveys(); 
        loadWithdrawRequests(); 
    })
    .catch((error) => {
        alert("Login Failed: INVALID_LOGIN_CREDENTIALS. Check Firebase Console.");
    });
}

// 2. Publish Survey (Timer Chara)
function publishSurvey() {
    const titleEl = document.getElementById("surveyTitle");
    const descEl = document.getElementById("surveyDesc");
    const rewardEl = document.getElementById("rewardCoins");
    const linkEl = document.getElementById("surveyLink");

    if (!titleEl || !descEl || !rewardEl || !linkEl) {
        alert("Error: Some HTML fields are missing!");
        return;
    }

    const title = titleEl.value;
    const desc = descEl.value;
    const reward = rewardEl.value;
    const link = linkEl.value;

    if (!title || !desc || !reward || !link) {
        alert("Please fill all fields!");
        return;
    }

    const surveyData = {
        title: title,
        desc: desc,
        reward: parseInt(reward),
        link: link,
        timestamp: Date.now()
    };

    firebase.database().ref("surveys").push(surveyData).then(() => {
        alert("Survey Published Successfully!");
        titleEl.value = ""; 
        descEl.value = ""; 
        rewardEl.value = ""; 
        linkEl.value = "";
    });
}

// 3. Published Survey List (ONLY DESCRIPTION SECTION UPDATED)
function loadAdminSurveys() {
    const listDiv = document.getElementById("adminSurveyList");
    if(!listDiv) return;

    firebase.database().ref("surveys").on("value", (snapshot) => {
        listDiv.innerHTML = "";
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const data = child.val();
                const key = child.key;
                
                const div = document.createElement("div");
                div.style = "background:#fff; padding:15px; margin-bottom:15px; border-radius:12px; border:1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.05);";
                div.innerHTML = `
                    <div style="margin-bottom: 10px;">
                        <strong style="display:block; font-size: 16px; color:#333;">${data.title}</strong>
                        
                        <div onclick="this.style.display='block'; this.style.webkitLineClamp='initial'; this.style.background='#fffbe6'; this.style.borderColor='#ffc107';" 
                             style="color:#555; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-size:13px; background:#f9f9f9; padding:8px; border-radius:8px; border:1.5px dashed #ccc; cursor:pointer; margin-top:8px; transition: all 0.3s ease;">
                             <span style="color:#d35400; font-weight:bold; font-size:11px; display:block; margin-bottom:4px;">📢 READ DESCRIPTION (CLICK TO EXPAND):</span>
                             ${data.desc || ''}
                        </div>
                        
                        <div style="margin-top:8px;">
                            <span style="color:#28a745; font-size:14px; font-weight: bold;">💰 ${data.reward} Coins</span>
                        </div>
                    </div>
                    <button onclick="deleteSurvey('${key}')" style="background:#ff4757; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; width: 100%; font-weight:bold;">Delete Survey</button>
                `;
                listDiv.appendChild(div);
            });
        } else {
            listDiv.innerHTML = "<p style='text-align:center; color:gray;'>No surveys published.</p>";
        }
    });
}

// 4. Delete & Withdraw logic
function deleteSurvey(key) {
    if(confirm("Are you sure you want to delete this survey?")) {
        firebase.database().ref("surveys/" + key).remove();
    }
}

function loadWithdrawRequests() {
    const listDiv = document.getElementById("pendingList"); 
    if (!listDiv) return;
    firebase.database().ref("withdraw_requests").on("value", (snap) => {
        listDiv.innerHTML = "";
        if (!snap.exists()) {
            listDiv.innerHTML = "<p style='text-align:center;'>No pending requests.</p>";
            return;
        }
        snap.forEach((child) => {
            const key = child.key;
            const data = child.val();
            if (data.status === "pending") {
                const card = document.createElement("div");
                card.style = "border:1px solid #eee; padding:15px; margin-top:10px; border-radius:12px; background:#fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";
                card.innerHTML = `
                    <p style="margin:0; font-weight:bold;">Email: ${data.email}</p>
                    <p style="margin:5px 0; color:#28a745;">Amount: ${data.amount} Coins</p>
                    <p style="margin:0; font-size:12px; color:#666;">Method: ${data.method}</p>
                    <div style="margin-top:10px;">
                        <button onclick="updateWithdrawStatus('${key}', 'Approved')" style="background:#28a745; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">Approve</button>
                        <button onclick="updateWithdrawStatus('${key}', 'Rejected')" style="background:#dc3545; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; margin-left:5px; font-weight:bold;">Reject</button>
                    </div>
                `;
                listDiv.appendChild(card);
            }
        });
    });
}

window.updateWithdrawStatus = function(key, status) {
    if(confirm("Are you sure to " + status + " this request?")) {
        firebase.database().ref("withdraw_requests/" + key).update({ status: status });
    }
}