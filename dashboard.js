// dashboard.js

// --------------------
// SECURITY & VPN CHECK (High CPM Countries Only)
// --------------------
const allowedCountries = ["US", "GB", "CA", "AU", "DE", "NO", "SE", "CH", "NL", "FR", "DK", "IE", "NZ", "AT", "BE"];

async function verifySecurity() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const userCountry = data.country_code;
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        //    
        if (!allowedCountries.includes(userCountry) || (userCountry === "US" && !userTimezone.includes("America"))) {
            alert("Security Alert: VPN or Unsupported Region Detected!");
            window.location.href = "index.html";
            return;
        }

        //     
        const infoDiv = document.getElementById('userCountryInfo');
        if(infoDiv) {
            infoDiv.innerHTML = `<img src="https://flagcdn.com/w40/${userCountry.toLowerCase()}.png" width="18" style="vertical-align:middle; border-radius:2px;"> ${data.country_name}`;
        }
    } catch (e) {
        console.log("Security check bypassed.");
    }
}
verifySecurity();
setInterval(verifySecurity, 60000); //      

// --------------------
// GLOBAL VARIABLES
// --------------------
let currentSurveyId = null;
let currentReward = 0;
let timerInterval = null;

// --------------------
// AUTH CHECK
// --------------------
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    loadUserBalance(user.uid);
    loadSurveys(user.uid);
});

// --------------------
// LOAD USER BALANCE
// --------------------
function loadUserBalance(uid) {
    const coinElement = document.getElementById("coins");
    if (!coinElement) return;

    firebase.database()
        .ref(`users/${uid}/balance`)
        .on("value", (snap) => {
            coinElement.innerText = snap.val() || 0;
        });
}

// --------------------
// LOAD SURVEYS
// --------------------
function loadSurveys(uid) {
    const listDiv = document.getElementById("surveyList");
    if (!listDiv) return;

    listDiv.innerHTML = "<p>Loading...</p>";

    const userRef = firebase.database().ref(`users/${uid}`);
    const surveyRef = firebase.database().ref("surveys");

    userRef.child("completed_surveys").once("value").then((doneSnap) => {
        const completed = doneSnap.val() || {};

        surveyRef.once("value").then((snap) => {
            listDiv.innerHTML = "";

            if (!snap.exists()) {
                listDiv.innerHTML =
                    "<p style='text-align:center;color:#999;'>No surveys available</p>";
                return;
            }

            let found = false;

            snap.forEach((child) => {
                const data = child.val();
                const key = child.key;

                // Validation
                if (
                    completed[key] ||
                    !data?.title ||
                    !data?.reward ||
                    !data?.link
                ) return;

                found = true;

                const card = document.createElement("div");
                card.className = "survey-card";
                card.innerHTML = `
                    <div class="survey-info">
                        <h4>${data.title}</h4>
                        <span> ${data.reward} Coins</span>
                    </div>
                    <button class="btn-start"
                        onclick="startSurvey(
                            '${key}',
                            '${data.link}',
                            ${data.reward},
                            ${data.timer || 30}
                        )">
                        Start
                    </button>
                `;

                listDiv.appendChild(card);
            });

            if (!found) {
                listDiv.innerHTML =
                    "<p style='text-align:center;color:#999;'>No new tasks</p>";
            }
        });
    });
}

// --------------------
// START SURVEY
// --------------------
function startSurvey(id, link, reward, timerSeconds) {
    currentSurveyId = id;
    currentReward = reward;

    window.open(link, "_blank");

    const modal = document.getElementById("timerModal");
    const countSpan = document.getElementById("countdown");
    const claimBtn = document.getElementById("claimBtn");

    if (modal) modal.style.display = "flex";

    if (claimBtn) {
        claimBtn.disabled = true;
        claimBtn.innerText = "Please wait...";
        claimBtn.style.background = "#ccc";
    }

    let timeLeft = timerSeconds;
    if (countSpan) countSpan.innerText = timeLeft;

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        if (countSpan) countSpan.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.innerText = "Claim Reward";
                claimBtn.style.background = "#333";
            }
        }
    }, 1000);
}

// --------------------
// COMPLETE SURVEY
// --------------------
function completeSurvey() {
    const user = firebase.auth().currentUser;
    if (!user || !currentSurveyId) return;

    const userRef = firebase.database().ref(`users/${user.uid}`);

    userRef.child(`completed_surveys/${currentSurveyId}`)
        .once("value")
        .then((snap) => {
            if (snap.exists()) {
                alert("Reward already claimed!");
                return;
            }

            // Mark completed
            userRef.child(`completed_surveys/${currentSurveyId}`).set(true);

            // Add balance safely
            userRef.child("balance").transaction((bal) => {
                return (bal || 0) + currentReward;
            });

            alert("Reward claimed successfully!");

            const modal = document.getElementById("timerModal");
            if (modal) modal.style.display = "none";

            // Reload surveys
            loadSurveys(user.uid);
        });
}

// -------------------
// LOGOUT
// --------------------
function logoutUser() {
    if (confirm("Are you sure you want to logout?")) {
        firebase.auth().signOut().then(() => {
            window.location.href = "index.html";
        });
    }
}