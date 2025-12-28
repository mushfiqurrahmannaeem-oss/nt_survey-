const premiumCountries = ["US", "GB", "CA", "AU", "DE", "NO", "SE", "CH", "NL", "FR", "DK", "IE", "NZ", "AT", "BE"];

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // ব্যালেন্স লোড (রিয়েলটাইম)
        firebase.database().ref("users/" + user.uid + "/balance").on("value", (snapshot) => {
            const balance = snapshot.val() || 0;
            const balElement = document.getElementById("coins") || document.getElementById("userBalance");
            if (balElement) balElement.innerText = balance;
        });

        // সার্ভে লোড করার সময় ইউজারের UID পাঠানো হচ্ছে
        if (typeof loadDashboardSurveys === "function") {
            loadDashboardSurveys(user.uid);
        } else if (typeof loadSurveys === "function") {
            loadSurveys(user.uid);
        }
    } else {
        window.location.href = "index.html";
    }
});

// অফার ফিল্টারিং এবং ডিসপ্লে লজিক
function loadDashboardSurveys(uid) {
    const taskDiv = document.getElementById("surveyList") || document.getElementById("taskDiv");
    if (!taskDiv) return;

    // userCountryCode যদি গ্লোবাল ভেরিয়েবল হিসেবে না থাকে, তবে ডিফাল্ট "Unknown"
    const currentCountry = typeof userCountryCode !== 'undefined' ? userCountryCode : "Unknown";

    firebase.database().ref("surveys").on("value", (snapshot) => {
        taskDiv.innerHTML = "";
        let found = false;

        snapshot.forEach((child) => {
            const data = child.val();
            const target = data.target || "Global"; 

            // ১. দেশ অনুযায়ী ফিল্টার লজিক
            let shouldShow = false;
            if (premiumCountries.includes(currentCountry)) {
                if (target === "Premium" || target === "Global") shouldShow = true;
            } else {
                if (target === "Global") shouldShow = true;
            }

            if (shouldShow) {
                found = true;

                // ২. অফার লিঙ্কের সাথে UID (subid) যোগ করার লজিক
                // যদি লিঙ্কে আগে থেকে '?' থাকে তবে '&' ব্যবহার হবে, নাহলে '?' ব্যবহার হবে
                const separator = data.link.includes('?') ? '&' : '?';
                const finalLink = `${data.link}${separator}subid=${uid}`;

                // ৩. কার্ড তৈরি এবং HTML এ যুক্ত করা
                const card = document.createElement("div");
                card.className = "survey-card";
                card.innerHTML = `
                    <div class="card-main">
                        <div>
                            <h4>${data.title}</h4>
                            <span><i class="fas fa-coins"></i> ${data.reward} Coins</span>
                        </div>
                        <button class="btn-start" onclick="window.open('${finalLink}', '_blank')">Start</button>
                    </div>
                    <div class="survey-desc" onclick="this.classList.toggle('active')">
                        ${data.desc || "Complete the task carefully to earn your reward."}
                    </div>
                `;
                taskDiv.appendChild(card);
            }
        });

        if (!found) {
            taskDiv.innerHTML = "<p style='text-align:center; color:#999; padding: 20px;'>No tasks available for your location right now.</p>";
        }
    });
}
