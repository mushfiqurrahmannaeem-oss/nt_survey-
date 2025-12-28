// --------------------
// USER INFO & GEO CHECK (All Countries Allowed)
// --------------------
async function updateUserInfo() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error("API Limit");
        
        const data = await response.json();
        const userCountry = data.country_code || "Unknown";

        // ড্যাশবোর্ডে ইউজারের দেশের নাম ও পতাকা দেখাবে
        const infoDiv = document.getElementById('userCountryInfo');
        if(infoDiv) {
            infoDiv.innerHTML = `
                <img src="https://flagcdn.com/w40/${userCountry.toLowerCase()}.png" 
                     onerror="this.src='https://flagcdn.com/w40/un.png'" 
                     width="18" style="vertical-align:middle; border-radius:2px;"> 
                ${data.country_name || userCountry}
            `;
        }
    } catch (e) {
        console.log("Country info fetch failed, but access granted.");
    }
}
updateUserInfo();

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
    if (user) {
        loadUserBalance(user.uid);
        loadSurveys(user.uid);
    } else {
        window.location.href = "index.html";
    }
});

// --------------------
// LOAD USER BALANCE
// --------------------
function loadUserBalance(uid) {
    const coinElement = document.getElementById("coins");
    if (!coinElement) return;

    // ডাটাবেস থেকে কয়েন ব্যালেন্স সিঙ্ক করা
    firebase.database()
        .ref(`users/${uid}/balance`)
        .on("value", (snap) => {
            coinElement.innerText = snap.val() || 0;
        });
}

// --------------------
// LOAD SURVEYS (Updated for Postback)
// --------------------
function loadSurveys(uid) {
    const listDiv = document.getElementById("surveyList");
    if (!listDiv) return;

    listDiv.innerHTML = "<p style='text-align:center;'>Loading tasks...</p>";

    const surveyRef = firebase.database().ref("surveys");

    surveyRef.once("value").then((snap) => {
        listDiv.innerHTML = "";

        if (!snap.exists()) {
            listDiv.innerHTML = "<p style='text-align:center;color:#999;'>No tasks available.</p>";
            return;
        }

        let found = false;

        snap.forEach((child) => {
            const data = child.val();
            const key = child.key;

            if (!data.title || !data.reward || !data.link) return;

            found = true;

            // লিঙ্কের সাথে subid (UID) যোগ করা
            const separator = data.link.includes('?') ? '&' : '?';
            const finalLink = `${data.link}${separator}subid=${uid}`;

            const card = document.createElement("div");
            card.className = "survey-card";
            card.innerHTML = `
                <div class="card-main">
                    <div>
                        <h4 style="margin:0; color:#2c3e50;">${data.title}</h4>
                        <span style="font-size:14px; color:#27ae60; font-weight:bold;">
                            <i class="fas fa-coins"></i> ${data.reward} Coins
                        </span>
                    </div>
                    <button class="btn-start" onclick="window.open('${finalLink}', '_blank')">
                        Start
                    </button>
                </div>
                <div class="survey-desc">${data.desc || "Complete this offer to get reward automatically."}</div>
            `;
            listDiv.appendChild(card);
        });

        if (!found) {
            listDiv.innerHTML = "<p style='text-align:center;color:#999;'>No new tasks at the moment.</p>";
        }
    });
}

// পুরাতন startSurvey এবং completeSurvey ফাংশনগুলো আর প্রয়োজন নেই। 
// কয়েন অটোমেটিক আপনার Vercel সার্ভার থেকে জমা হবে।


// --------------------
// START SURVEY
// --------------------
function startSurvey(id, link, reward, timerSeconds) {
    currentSurveyId = id;
    currentReward = reward;

    // নতুন ট্যাবে সার্ভে ওপেন হবে
    window.open(link, "_blank");

    const modal = document.getElementById("timerModal");
    const countSpan = document.getElementById("countdown");
    const claimBtn = document.getElementById("claimBtn");

    if (modal) modal.style.display = "flex";

    if (claimBtn) {
        claimBtn.disabled = true;
        claimBtn.innerText = "Please wait...";
        claimBtn.style.background = "#bdc3c7";
    }

    let timeLeft = timerSeconds;
    if (countSpan) countSpan.innerText = timeLeft;

    clearInterval(timerInterval);

    // টাইমার শুরু
    timerInterval = setInterval(() => {
        timeLeft--;
        if (countSpan) countSpan.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.innerText = "Claim Reward";
                claimBtn.style.background = "#2c3e50";
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

    userRef.child(`completed_surveys/${currentSurveyId}`).once("value").then((snap) => {
        if (snap.exists()) {
            alert("This reward has already been claimed.");
            return;
        }

        // রিওয়ার্ড ব্যালেন্স ট্রানজ্যাকশন মোডে অ্যাড করা যাতে ভুল না হয়
        userRef.child("balance").transaction((currentBal) => {
            return (currentBal || 0) + currentReward;
        }).then(() => {
            // কমপ্লিটেড লিস্টে যুক্ত করা
            userRef.child(`completed_surveys/${currentSurveyId}`).set(true);
            
            alert("Success! Coins added to your balance.");
            
            const modal = document.getElementById("timerModal");
            if (modal) modal.style.display = "none";
            
            loadSurveys(user.uid);
        }).catch((err) => {
            console.error("Reward claiming failed:", err);
        });
    });
}

// --------------------
// LOGOUT
// --------------------
function logoutUser() {
    if (confirm("Are you sure you want to sign out?")) {
        firebase.auth().signOut().then(() => {
            window.location.href = "index.html";
        });
    }
}