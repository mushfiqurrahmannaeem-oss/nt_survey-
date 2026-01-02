// ১. দেশের লিস্ট সরাসরি কোডের ভেতর (যাতে এপিআই ফেইল না করে)
const countryData = [
    {n: "Bangladesh", c: "BD"}, {n: "United States", c: "US"},
    {n: "United Kingdom", c: "GB"}, {n: "Canada", c: "CA"},
    {n: "India", c: "IN"}, {n: "Germany", code: "DE"},
    {n: "France", c: "FR"}, {n: "Australia", c: "AU"},
    {n: "Italy", c: "IT"}, {n: "Pakistan", c: "PK"},
    {n: "Spain", c: "ES"}, {n: "Russia", c: "RU"},
    {n: "Japan", c: "JP"}, {n: "Brazil", c: "BR"}
];

// ২. ড্রপডাউন লোড করার ফাংশন
function populateDropdown() {
    const select = document.getElementById("targetGroup");
    if (!select) return;

    // আগের অপশনগুলো ঠিক রেখে নতুন দেশগুলো যোগ করা
    countryData.forEach(country => {
        const option = document.createElement("option");
        option.value = country.c;
        
        // কান্ট্রি কোড থেকে পতাকা তৈরির লজিক
        const flag = country.c.toUpperCase().replace(/./g, char => 
            String.fromCodePoint(char.charCodeAt(0) + 127397)
        );
        
        option.textContent = `${flag} ${country.n}`;
        select.appendChild(option);
    });
}

// ৩. পেজ লোড হলে সব শুরু হবে
document.addEventListener("DOMContentLoaded", () => {
    populateDropdown(); // ড্রপডাউন আগে লোড হবে
    
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            document.getElementById("loginSection").style.display = "none";
            document.getElementById("adminDashboard").style.display = "block";
            loadAdminSurveys();
            loadWithdrawRequests();
        }
    });
});

// ৪. সার্ভে পাবলিশ ফাংশন
function publishSurvey() {
    const title = document.getElementById("surveyTitle").value;
    const desc = document.getElementById("surveyDesc").value;
    const reward = document.getElementById("rewardCoins").value;
    const link = document.getElementById("surveyLink").value;
    const targetGroup = document.getElementById("targetGroup").value;

    if (!title || !reward || !link) {
        alert("সবগুলো ঘর পূরণ করুন!");
        return;
    }

    firebase.database().ref("surveys").push({
        title: title,
        desc: desc,
        reward: parseInt(reward),
        link: link,
        target_group: targetGroup,
        timestamp: Date.now()
    }).then(() => {
        alert("সার্ভে পাবলিশ হয়েছে: " + targetGroup);
        // ফর্ম ক্লিয়ার করা
        document.getElementById("surveyTitle").value = "";
        document.getElementById("rewardCoins").value = "";
        document.getElementById("surveyLink").value = "";
    }).catch(err => alert(err.message));
}

// ৫. পুরনো সার্ভে লোড করা
function loadAdminSurveys() {
    firebase.database().ref("surveys").on("value", (snap) => {
        const list = document.getElementById("adminSurveyList");
        list.innerHTML = "";
        if(!snap.exists()) {
            list.innerHTML = "No surveys found.";
            return;
        }
        snap.forEach(child => {
            const data = child.val();
            const div = document.createElement("div");
            div.style = "background:#fff; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;";
            div.innerHTML = `
                <small style="color:blue;">Target: ${data.target_group}</small>
                <h4 style="margin:5px 0;">${data.title}</h4>
                <button onclick="deleteSurvey('${child.key}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Delete</button>
            `;
            list.appendChild(div);
        });
    });
}

function deleteSurvey(key) {
    if(confirm("Are you sure?")) {
        firebase.database().ref("surveys/" + key).remove();
    }
}

// লগইন এবং উইথড্র ফাংশন আগের মতোই কাজ করবে
function adminLogin() {
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => location.reload())
        .catch(err => alert(err.message));
}

function loadWithdrawRequests() {
    firebase.database().ref("withdraw_requests").on("value", snap => {
        const list = document.getElementById("pendingList");
        list.innerHTML = "";
        snap.forEach(child => {
            const d = child.val();
            if(d.status === "pending") {
                const div = document.createElement("div");
                div.innerHTML = `<p>${d.email} - ${d.amount} <button onclick="firebase.database().ref('withdraw_requests/${child.key}/status').set('approved')">Approve</button></p>`;
                list.appendChild(div);
            }
        });
    });
}