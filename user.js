// 1. Auth State Check
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("Dashboard loaded for:", user.email);
        
        // User balance load kora
        // Ekhane db variable-ti config.js theke auto pabe
        db.ref("users/" + user.uid + "/balance").on("value", (snapshot) => {
            const balance = snapshot.val() || 0;
            const balElement = document.getElementById("userBalance");
            if (balElement) balElement.innerText = balance;
        });

        // Dashboard surveys load kora
        loadDashboardSurveys(user.uid);
    } else {
        window.location.href = "index.html";
    }
});

// 2. Published Survey Dashboard-e dekhano
function loadDashboardSurveys(uid) {
    const taskDiv = document.getElementById("surveyList");
    if (!taskDiv) return;

    // Loading status
    taskDiv.innerHTML = "<p style='text-align:center;color:#999'>Checking for tasks...</p>";

    // Complete kora survey gulo check kora
    db.ref("users/" + uid + "/completed_surveys").on("value", (doneSnapshot) => {
        const completedIds = doneSnapshot.val() || {};

        // Main surveys node read kora
        db.ref("surveys").on("value", (snapshot) => {
            taskDiv.innerHTML = ""; 

            if (snapshot.exists()) {
                let found = false;
                snapshot.forEach((child) => {
                    const key = child.key;
                    const data = child.val();

                    // Jodi user eita age na kore thake
                    if (!completedIds[key]) {
                        found = true;
                        const card = document.createElement("div");
                        card.className = "survey-card";
                        card.innerHTML = `
                            <div class="card-info">
                                <strong>${data.title}</strong>
                                <p>+${data.reward} Coins</p>
                            </div>
                            <button class="btn-start" onclick="startSurvey('${key}', '${data.link}', ${data.reward})">Start</button>
                        `;
                        taskDiv.appendChild(card);
                    }
                });

                if (!found) {
                    taskDiv.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'>No new tasks available!</p>";
                }
            } else {
                taskDiv.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'>No surveys published.</p>";
            }
        });
    });
}

// 3. Survey start logic
function startSurvey(key, link, reward) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    window.open(link, "_blank");

    // Click korar sathe sathe completed mark kora
    db.ref("users/" + user.uid + "/completed_surveys/" + key).set(true)
    .then(() => {
        // Balance add kora
        db.ref("users/" + user.uid + "/balance").transaction((current) => {
            return (current || 0) + reward;
        });
    });
}

// 4. Logout Function
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "index.html";
    });
}
