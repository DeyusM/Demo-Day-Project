document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("sub-form");
  const nameInput = document.getElementById("sub-name");
  const costInput = document.getElementById("cost");
  const periodSelect = document.getElementById("period");
  const dateInput = document.getElementById("start-date");
  const addDescBtn = document.getElementById("add-description");

  const tableHeaderRow = document.getElementById("table-header");
  const tableBody = document.getElementById("table-body");
  const totalMonthlyEl = document.getElementById("total-monthly");
  const upcomingList = document.getElementById("upcoming-list");
  const notificationPopup = document.getElementById("notification-popup");
  const notificationsBtn = document.getElementById("notifications-btn");

  let subscriptions = JSON.parse(localStorage.getItem("subscriptions")) || [];
  let extraHeaders = JSON.parse(localStorage.getItem("extraHeaders")) || [];

  function saveAll(){
    localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
    localStorage.setItem("extraHeaders", JSON.stringify(extraHeaders));
  }
  function restoreExtraHeaders(){

    extraHeaders.forEach((hdr, i) => {
      addExtraHeaderToDOM(hdr, i);
    });
  }

  function addExtraHeaderToDOM(headerText, index){

    const th = document.createElement("th");
    th.textContent = headerText;
    const actionTh = tableHeaderRow.querySelector(".action-col");
    tableHeaderRow.insertBefore(th, actionTh);

    const input = document.createElement("input");
    input.type = "text";
    input.id = `extra-${index}`;
    input.placeholder = headerText;

    form.insertBefore(input, addDescBtn);
  }

  function parseCost(costStr){
    if (!costStr) return 0;
    const cleaned = costStr.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  }

  function updateTable(){
    tableBody.innerHTML = "";
    let totalMonthly = 0;

    subscriptions.forEach((sub, idx) => {
      const tr = document.createElement("tr");

      const now = new Date();
      const dueDate = new Date(sub.date);
      const msPerDay = 1000 * 60 * 60 * 24;
      let daysLeft = Math.ceil((dueDate - now) / msPerDay);

      const displayDays = daysLeft > 0 ? daysLeft : "Expired";

      let rowHTML = `
        <td>${escapeHtml(sub.name)}</td>
        <td>${escapeHtml(sub.cost)}</td>
        <td>${escapeHtml(sub.date)}</td>
        <td>${displayDays}</td>
      `;

      extraHeaders.forEach(hdr => {
     
        rowHTML += `<td>${escapeHtml(sub[hdr] || "")}</td>`;
      });

      rowHTML += `<td><button class="delete-btn" data-index="${idx}" title="Delete">Delete</button></td>`;

      tr.innerHTML = rowHTML;
      tableBody.appendChild(tr);

      const clean = parseCost(sub.cost);
      totalMonthly += (sub.period === "yearly") ? (clean / 12) : clean;
    });

    totalMonthlyEl.textContent = `Total Monthly Cost: $${totalMonthly.toFixed(2)}`;

    updateUpcomingAndNotifications();
    saveAll();
  }

  function updateUpcomingAndNotifications(){
    if (subscriptions.length === 0){
      upcomingList.textContent = "No upcoming charges.";
      notificationPopup.innerHTML = "<p>No upcoming notifications.</p>";
      return;
    }

    const now = new Date();
    const sorted = [...subscriptions].slice().sort((a,b) => new Date(a.date) - new Date(b.date));
    const soon = sorted.slice(0,3);
    upcomingList.innerHTML = soon.map(s => {
      const dLeft = Math.ceil((new Date(s.date) - now) / (1000*60*60*24));
      const daysText = dLeft > 0 ? `${dLeft} day${dLeft===1?"":"s"}` : "Due";
      return `<div class="up-item"><strong>${escapeHtml(s.name)}</strong> — ${escapeHtml(s.cost)} • ${daysText}</div>`;
    }).join("");

    notificationPopup.innerHTML = soon.map(s => {
      const dLeft = Math.ceil((new Date(s.date) - now) / (1000*60*60*24));
      const daysText = dLeft > 0 ? `${dLeft} day${dLeft===1?"":"s"}` : "Due";
      return `<p><strong>${escapeHtml(s.name)}</strong> renews in ${daysText}</p>`;
    }).join("");
  }

  addDescBtn.addEventListener("click", () => {
    const newHeader = prompt("Enter new column name:");
    if (!newHeader) return;
    const trimmed = newHeader.trim();
    if (!trimmed) return alert("Column name cannot be empty.");
   
    extraHeaders.push(trimmed);

    addExtraHeaderToDOM(trimmed, extraHeaders.length - 1);
    saveAll();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const cost = costInput.value.trim();
    const period = periodSelect.value;
    const date = dateInput.value;

    if (!name || !cost || !date) return;

    const newSub = { name, cost, period, date };

    extraHeaders.forEach((hdr, i) => {
      const el = document.getElementById(`extra-${i}`);
      newSub[hdr] = el ? el.value.trim() : "";
    });

    subscriptions.push(newSub);
    updateTable();
    form.reset();
  });

  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;
    const idx = Number(btn.dataset.index);
    if (!isNaN(idx)){
      subscriptions.splice(idx, 1);
      updateTable();
    }
  });

  notificationsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    notificationPopup.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    const popupOpen = !notificationPopup.classList.contains("hidden");
    if (!popupOpen) return;
    if (!e.target.closest("#notification-popup") && !e.target.closest("#notifications-btn")) {
      notificationPopup.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") notificationPopup.classList.add("hidden");
  });

  function escapeHtml(str){
    if (!str && str !== 0) return "";
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  restoreExtraHeaders();
  updateTable();
});
