/* =========================================
   WOOFY — Main JavaScript
   Cute, playful & interactive
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* ================================
       WOOfY API CLIENT — PostgreSQL is the source of truth
    ================================= */
    const WOOFY_API_BASE = "http://127.0.0.1:8000";
    const getAccessToken = () => localStorage.getItem("woofyAccessToken") || "";
    const apiRequest = async (path, options = {}) => {
        const headers = { ...(options.headers || {}) };
        if (options.body !== undefined && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
        if (getAccessToken()) headers.Authorization = `Bearer ${getAccessToken()}`;
        const response = await fetch(`${WOOFY_API_BASE}${path}`, { ...options, headers });
        if (response.status === 204) return null;
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || `Request failed (${response.status}).`);
        return data;
    };
    const showApiError = (error, fallback = "Something went wrong. Please try again.") => {
        console.error("Woofy API:", error);
        showMessage(error?.message || fallback, "error");
    };

    /* ================================
       1. SCROLL REVEAL ANIMATIONS
    ================================= */

    const revealElements = document.querySelectorAll(".reveal");

    if (revealElements.length > 0) {

        const revealObserver = new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {
                        entry.target.classList.add("show");
                    }

                });

            },
            {
                threshold: 0.12
            }
        );

        revealElements.forEach((element) => {
            revealObserver.observe(element);
        });
    }


    /* ================================
       2. NAVBAR SCROLL EFFECT
    ================================= */

    const nav = document.querySelector(".nav");

    if (nav) {

        window.addEventListener("scroll", () => {

            if (window.scrollY > 40) {
                nav.style.boxShadow =
                    "0 15px 40px rgba(61,42,26,.12)";
            } else {
                nav.style.boxShadow =
                    "0 10px 30px rgba(61,42,26,.08)";
            }

        });

    }


    /* ================================
       3. FLOATING STICKERS
    ================================= */

    const stickers = document.querySelectorAll(".sticker");

    stickers.forEach((sticker, index) => {

        const randomDelay = Math.random() * 1.5;

        sticker.style.animationDelay = `${randomDelay}s`;

        sticker.addEventListener("mouseenter", () => {

            sticker.style.transform =
                `${sticker.style.transform || ""} translateY(-8px) scale(1.05)`;

        });

        sticker.addEventListener("mouseleave", () => {

            sticker.style.transform = "";
        });

    });


    /* ================================
       4. SERVICE CARD TILT
    ================================= */

    const serviceCards = document.querySelectorAll(".service");

    serviceCards.forEach((card) => {

        card.addEventListener("mousemove", (event) => {

            const rect = card.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX =
                ((y - centerY) / centerY) * -2;

            const rotateY =
                ((x - centerX) / centerX) * 2;

            card.style.transform =
                `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform =
                "translateY(0) rotateX(0) rotateY(0)";

        });

    });


    /* ================================
       5. BUTTON MICRO-INTERACTION
    ================================= */

    const buttons = document.querySelectorAll(".btn");

    buttons.forEach((button) => {

        button.addEventListener("click", () => {

            button.style.transform = "scale(.96)";

            setTimeout(() => {
                button.style.transform = "";
            }, 120);

        });

    });


    /* ================================
       6. PAW CURSOR TRAIL
    ================================= */

    let lastPawTime = 0;

    document.addEventListener("mousemove", (event) => {

        const now = Date.now();

        // Don't create too many paws
        if (now - lastPawTime < 180) {
            return;
        }

        lastPawTime = now;

        // Only on desktop
        if (window.innerWidth < 800) {
            return;
        }

        const paw = document.createElement("span");

        paw.textContent = "🐾";

        paw.style.position = "fixed";
        paw.style.left = `${event.clientX}px`;
        paw.style.top = `${event.clientY}px`;
        paw.style.pointerEvents = "none";
        paw.style.fontSize = "13px";
        paw.style.zIndex = "9999";
        paw.style.opacity = "0.45";
        paw.style.transform = "translate(-50%, -50%)";
        paw.style.transition =
            "opacity .7s ease, transform .7s ease";

        document.body.appendChild(paw);

        requestAnimationFrame(() => {

            paw.style.opacity = "0";
            paw.style.transform =
                "translate(-50%, -80%) scale(.7)";

        });

        setTimeout(() => {
            paw.remove();
        }, 750);

    });


    /* ================================
       7. REGISTRATION — FASTAPI + POSTGRESQL
    ================================= */
    const registerForm = document.querySelector("#registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const name = document.querySelector("#name").value.trim();
            const email = document.querySelector("#email").value.trim().toLowerCase();
            const password = document.querySelector("#password").value;
            const role = document.querySelector("#role").value;
            const termsAccepted = document.querySelector("#terms").checked;
            if (!name || !email || !password || !role || !termsAccepted) {
                showMessage("Please complete every field first 🐾", "error");
                return;
            }
            if (password.length < 10) {
                showMessage("Please use a password with at least 10 characters.", "error");
                return;
            }
            const submitButton = registerForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;
            try {
                const result = await apiRequest("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify({ name, email, password, role })
                });
                showMessage(result.message || `You're in, ${name}! Welcome to woofy 🐶✨`);
                registerForm.reset();
                setTimeout(() => { window.location.href = "login.html"; }, 900);
            } catch (error) {
                showApiError(error, "We couldn't create your account. Please try again.");
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    /* ================================
       8. LOGIN — JWT AUTHENTICATION
    ================================= */
    const loginForm = document.querySelector("#loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.querySelector("#email").value.trim().toLowerCase();
            const password = document.querySelector("#password").value;
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;
            try {
                const result = await apiRequest("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ email, password })
                });
                localStorage.setItem("woofyAccessToken", result.access_token);
                localStorage.setItem("woofyCurrentUser", JSON.stringify(result.user));
                localStorage.setItem("woofyLoggedIn", "true");
                showMessage(`Welcome back, ${result.user.name}! 🐶`);
                setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
            } catch (error) {
                showApiError(error, "Email or password doesn't match. Try again! 🐾");
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    /* Password reset is a placeholder until email services are connected. */
    const forgotPasswordLink = document.querySelector("#forgotPassword");
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (event) => {
            event.preventDefault();
            showMessage("Password reset will be available when email services are connected.", "error");
        });
    }


    /* ================================
       9. PERSONALIZE DASHBOARD
    ================================= */

    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem("woofyCurrentUser") || "null"); } catch { currentUser = null; }
    const isDashboardPage = Boolean(document.querySelector(".dashboard-page"));
    if (isDashboardPage) {
        if (!getAccessToken() || localStorage.getItem("woofyLoggedIn") !== "true") {
            localStorage.removeItem("woofyCurrentUser");
            window.location.href = "login.html";
            return;
        }
        try {
            currentUser = await apiRequest("/api/auth/me");
            localStorage.setItem("woofyCurrentUser", JSON.stringify(currentUser));
        } catch (error) {
            localStorage.removeItem("woofyAccessToken");
            localStorage.removeItem("woofyCurrentUser");
            localStorage.removeItem("woofyLoggedIn");
            showMessage(error.message || "Your session has expired. Please log in again.", "error");
            window.location.href = "login.html";
            return;
        }

        // Load the signed-in user's database records into the existing dashboard's
        // view cache. Every create/update action below also writes through to the API.
        try {
            const [apiPets, apiAppointments, apiRecords, apiVaccinations, apiNotifications, apiProfile] = await Promise.all([
                apiRequest("/api/pets"), apiRequest("/api/appointments"),
                apiRequest("/api/medical-records"), apiRequest("/api/vaccinations"),
                apiRequest("/api/notifications"), apiRequest("/api/profile")
            ]);
            const petsCache = apiPets.map((pet) => {
                const linkedAppointment = apiAppointments.find((appointment) => appointment.pet_id === pet.id);
                return { id: pet.id, ownerId: pet.owner_id,
                    ownerEmail: currentUser.role === "pet_parent" ? currentUser.email : (linkedAppointment?.parent_email || ""),
                    ownerName: currentUser.role === "pet_parent" ? currentUser.name : (linkedAppointment?.parent_name || "Pet parent"),
                    name: pet.name, type: pet.animal_type, breed: pet.breed || "", age: pet.age_years ?? "",
                    weight: pet.weight_kg ?? "", notes: pet.notes || "", photo: pet.photo_data || "", createdAt: pet.created_at };
            });
            const appointmentsCache = apiAppointments.map((item) => ({ id: item.id, parentId: item.parent_id, parentEmail: item.parent_email || (currentUser.role === "pet_parent" ? currentUser.email : ""), parentName: item.parent_name || "Pet parent", vetId: item.vet_id, vetEmail: item.vet_email || (currentUser.role === "veterinarian" ? currentUser.email : ""), vetName: item.vet_name || "Veterinarian", petId: item.pet_id, petName: item.pet_name || "Pet", dateTime: item.date_time, reason: item.reason, status: item.status, createdAt: item.created_at }));
            const recordsCache = apiRecords.map((item) => ({ id: item.id, petId: item.pet_id, petName: item.pet_name || "Pet", parentEmail: item.parent_email || "", vetEmail: item.vet_email || currentUser.email, vetName: item.vet_name || currentUser.name, title: item.title, type: item.record_type, date: String(item.record_date || "").slice(0, 10), notes: item.notes || "", prescription: item.prescription || "" }));
            const vaccinationsCache = apiVaccinations.map((item) => ({ id: item.id, petId: item.pet_id, petName: item.pet_name || "Pet", parentEmail: item.parent_email || "", vetEmail: item.vet_email || currentUser.email, vetName: item.vet_name || currentUser.name, vaccineName: item.vaccine_name, dateAdministered: String(item.date_administered || "").slice(0, 10), nextDueDate: item.next_due_date ? String(item.next_due_date).slice(0, 10) : "", notes: item.notes || "" }));
            const notificationsCache = apiNotifications.map((item) => ({ id: item.id, recipientEmail: currentUser.email, type: item.kind, title: item.title, message: item.body, relatedId: item.related_id, sourceKey: item.source_key, read: item.is_read, createdAt: item.created_at }));
            localStorage.setItem("woofyPets", JSON.stringify(petsCache));
            localStorage.setItem("woofyAppointments", JSON.stringify(appointmentsCache));
            localStorage.setItem("woofyMedicalRecords", JSON.stringify(recordsCache));
            localStorage.setItem("woofyVaccinations", JSON.stringify(vaccinationsCache));
            localStorage.setItem("woofyNotifications", JSON.stringify(notificationsCache));
            localStorage.setItem(`woofyProfile:${currentUser.email}`, JSON.stringify({ phone: apiProfile.phone || "", city: apiProfile.location || "", district: "", state: "", pincode: "", address: apiProfile.clinic_address || "", photo: apiProfile.photo_data || "", clinicName: apiProfile.clinic_name || "" }));
            let directory = [];
            if (currentUser.role === "administrator") directory = await apiRequest("/api/admin/users");
            else directory = await apiRequest("/api/vets");
            const directoryUsers = directory.map((item) => ({ id: item.id, name: item.name, email: item.email, role: item.role, status: item.status, vetApproval: item.vetApproval || "approved", clinicName: item.clinicName || "", clinicAddress: item.clinicAddress || "" }));
            if (!directoryUsers.some((item) => item.id === currentUser.id)) directoryUsers.push(currentUser);
            localStorage.setItem("woofyUsers", JSON.stringify(directoryUsers));
            if (currentUser.role === "pet_parent" || currentUser.role === "veterinarian") {
                const apiThreads = await apiRequest("/api/conversations");
                const mappedThreads = await Promise.all(apiThreads.map(async (thread) => {
                    const messages = await apiRequest(`/api/conversations/${thread.id}/messages`);
                    const otherUser = currentUser.role === "pet_parent"
                        ? { email: thread.vet_email, name: thread.vet_name }
                        : { email: thread.parent_email, name: thread.parent_name };
                    const pet = petsCache.find((item) => item.id === thread.pet_id);
                    return {
                        id: thread.id, parentEmail: thread.parent_email || (currentUser.role === "pet_parent" ? currentUser.email : ""),
                        parentName: thread.parent_name || (currentUser.role === "pet_parent" ? currentUser.name : "Pet parent"),
                        vetEmail: thread.vet_email || (currentUser.role === "veterinarian" ? currentUser.email : ""),
                        vetName: thread.vet_name || (currentUser.role === "veterinarian" ? currentUser.name : "Veterinarian"),
                        petId: thread.pet_id, petName: pet?.name || thread.pet_name || "Pet",
                        createdAt: thread.created_at, updatedAt: messages.at(-1)?.created_at || thread.created_at,
                        messages: messages.map((message) => ({ senderEmail: message.sender_id === currentUser.id ? currentUser.email : (otherUser?.email || ""), senderName: message.sender_id === currentUser.id ? currentUser.name : (otherUser?.name || "woofy user"), content: message.body, sentAt: message.created_at }))
                    };
                }));
                localStorage.setItem("woofyConversations", JSON.stringify(mappedThreads));
            }
            if (currentUser.role === "veterinarian" && currentUser.vetApproval === "approved") {
                const schedule = await apiRequest(`/api/vets/${currentUser.id}/schedule`);
                localStorage.setItem(`woofyVetSchedule:${currentUser.email}`, JSON.stringify({ days: schedule.days || {} }));
            } else if (currentUser.role === "veterinarian") {
                localStorage.setItem(`woofyVetSchedule:${currentUser.email}`, JSON.stringify({ days: {} }));
            } else if (currentUser.role === "pet_parent") {
                const vets = directoryUsers.filter((item) => item.role === "veterinarian" && item.status === "active" && item.vetApproval === "approved");
                await Promise.all(vets.map(async (vet) => {
                    try {
                        const schedule = await apiRequest(`/api/vets/${vet.id}/schedule`);
                        localStorage.setItem(`woofyVetSchedule:${vet.email}`, JSON.stringify({ days: schedule.days || {} }));
                    } catch (error) { console.warn(`Could not load schedule for ${vet.email}:`, error); }
                }));
            }
        } catch (error) {
            console.error("Dashboard data loading failed:", error);
            showMessage(`Some dashboard data could not be loaded: ${error.message}`, "error");
        }
    }

    const welcomeName = document.querySelector("#welcomeName");
    const dashboardUserName = document.querySelector("#dashboardUserName");
    const dashboardRole = document.querySelector("#dashboardRole");

    if (document.querySelector(".dashboard-page")) {
        if (!currentUser) { window.location.href = "login.html"; return; }

        if (welcomeName) welcomeName.textContent = currentUser.name;
        if (dashboardUserName) dashboardUserName.textContent = currentUser.name;
        const roleLabels = { pet_parent: "Pet Parent", veterinarian: "Veterinarian", administrator: "Administrator" };
        if (dashboardRole) dashboardRole.textContent = roleLabels[currentUser.role] || "Pet Parent";

        const isVeterinarian = currentUser.role === "veterinarian";
        const isAdmin = currentUser.role === "administrator";
        const vetApprovalStatus = currentUser.vetApproval || "approved";
        const vetPending = isVeterinarian && vetApprovalStatus !== "approved";
        if (isVeterinarian || isAdmin) document.querySelector("#petParentPanels")?.setAttribute("hidden", "");
        if (isVeterinarian) {
            document.querySelector("#vetPanels")?.removeAttribute("hidden");
            if (welcomeName) welcomeName.textContent = currentUser.name;
            const intro = document.querySelector("#dashboardIntro");
            if (intro) intro.textContent = vetPending ? (vetApprovalStatus === "rejected" ? "Your veterinarian registration needs attention from the woofy team." : "Your clinic profile is waiting for administrator approval.") : "Your clinic workspace is ready for its next little patient.";
            if (vetPending) {
                ["vet-appointments", "vet-patients", "vet-vaccinations", "vet-records-form-panel", "vet-records-list-panel", "vetMessages"].forEach((id) => document.getElementById(id)?.setAttribute("hidden", ""));
                document.querySelectorAll('.sidebar a[data-role="veterinarian"]').forEach((link) => {
                    if (["#vet-appointments", "#vet-patients", "#vet-vaccinations", "#vet-records-form-panel", "#vetMessages"].includes(link.getAttribute("href"))) link.hidden = true;
                    if (vetApprovalStatus === "rejected" && link.getAttribute("href") === "#vet-schedule") link.hidden = true;
                });
                const schedule = document.querySelector("#vet-schedule");
                if (schedule) { const note = document.createElement("p"); note.className = "vet-pending-note"; note.textContent = vetApprovalStatus === "rejected" ? "Your veterinarian registration was not approved. Please contact woofy support if you believe this is a mistake." : "Your veterinarian account is pending review. You can complete your clinic schedule and profile while an administrator reviews your registration."; schedule.prepend(note); if (vetApprovalStatus === "rejected") schedule.setAttribute("hidden", ""); }
            }
        }
        if (isAdmin) {
            document.querySelector("#adminPanels")?.removeAttribute("hidden");
            document.querySelector("#profilePanel")?.setAttribute("hidden", "");
            const intro = document.querySelector("#dashboardIntro");
            if (intro) intro.textContent = "Your woofy control room: people, appointments and platform updates.";
        }
        document.querySelectorAll(".sidebar [data-role]").forEach((link) => { link.hidden = link.dataset.role !== currentUser.role; });

        const petForm = document.querySelector("#addPetForm");
        const showPetFormButton = document.querySelector("#showPetForm");
        const petList = document.querySelector("#petList");
        const petPhotoInput = document.querySelector("#petPhoto");
        const petPhotoPreview = document.querySelector("#petPhotoPreview");
        const petTypeSelect = document.querySelector("#petType");
        const petCustomTypeInput = document.querySelector("#petCustomType");
        const savePetButton = document.querySelector("#savePetButton");
        const cancelPetEditButton = document.querySelector("#cancelPetEdit");
        const readLocalArray = (key) => {
            try {
                const value = JSON.parse(localStorage.getItem(key) || "[]");
                return Array.isArray(value) ? value : [];
            } catch (error) { return []; }
        };
        const saveLocalArray = (key, items) => localStorage.setItem(key, JSON.stringify(items));

        /* NOTIFICATIONS + CARE REMINDERS — LOCAL PREVIEW */
        const notificationList = document.querySelector("#notificationList");
        const notificationKey = "woofyNotifications";
        const readNotifications = () => readLocalArray(notificationKey);
        const saveNotifications = (items) => saveLocalArray(notificationKey, items);
        const createNotification = (recipientEmail, type, title, message, relatedId = "", sourceKey = "") => {
            if (!recipientEmail) return;
            const items = readNotifications();
            if (sourceKey && items.some((item) => item.sourceKey === sourceKey && item.recipientEmail === recipientEmail)) return;
            items.push({ id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, recipientEmail, type, title, message, relatedId, sourceKey, read: false, createdAt: new Date().toISOString() });
            saveNotifications(items);
            renderNotifications();
        };
        const renderNotifications = () => {
            const mine = readNotifications().filter((item) => item.recipientEmail === currentUser.email).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            const unread = mine.filter((item) => !item.read).length;
            const count = document.querySelector("#notificationNavCount");
            if (count) { count.textContent = unread > 99 ? "99+" : String(unread); count.hidden = unread === 0; }
            if (!notificationList) return;
            notificationList.replaceChildren();
            if (!mine.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "You're all caught up! New updates and care reminders will appear here."; notificationList.appendChild(empty); return; }
            mine.forEach((item) => {
                const card = document.createElement("article"); card.className = `notification-card${item.read ? " is-read" : " is-unread"}`;
                const icon = document.createElement("span"); icon.className = "notification-icon"; icon.textContent = ({ appointment: "🗓️", message: "💬", vaccination: "💉", reminder: "⏰", announcement: "📣", account: "🐾" })[item.type] || "🔔";
                const body = document.createElement("div"); body.className = "notification-copy";
                const title = document.createElement("strong"); title.textContent = item.title;
                const message = document.createElement("p"); message.textContent = item.message;
                const time = document.createElement("small"); time.textContent = (() => { const date = new Date(item.createdAt); return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); })();
                body.append(title, message, time); card.append(icon, body);
                if (!item.read) { const mark = document.createElement("button"); mark.type = "button"; mark.className = "btn btn-light notification-read-button"; mark.textContent = "Mark read"; mark.addEventListener("click", async () => { try { await apiRequest(`/api/notifications/${item.id}`, { method: "PATCH", body: JSON.stringify({ is_read: true }) }); const all = readNotifications(); const target = all.find((entry) => entry.id === item.id); if (target) target.read = true; saveNotifications(all); renderNotifications(); } catch (error) { showApiError(error); } }); card.appendChild(mark); }
                notificationList.appendChild(card);
            });
        };
        document.querySelector("#markAllNotificationsRead")?.addEventListener("click", async () => { try { await apiRequest("/api/notifications/read-all", { method: "POST" }); const all = readNotifications(); all.forEach((item) => { item.read = true; }); saveNotifications(all); renderNotifications(); } catch (error) { showApiError(error); } });
        const generateCareReminders = () => {
            const now = new Date();
            if (currentUser.role === "pet_parent") {
                readLocalArray("woofyAppointments").filter((item) => item.parentEmail === currentUser.email && ["pending", "accepted"].includes(item.status || "pending")).forEach((item) => {
                    const date = new Date(item.dateTime); const hours = (date - now) / 3600000;
                    if (Number.isFinite(hours) && hours > 0 && hours <= 24) createNotification(currentUser.email, "reminder", "Appointment coming up", `${item.petName || "Your pet"} has a vet appointment within the next 24 hours.`, item.id, `appt-reminder:${item.id}`);
                });
                readLocalArray("woofyVaccinations").filter((item) => item.parentEmail === currentUser.email && item.nextDueDate).forEach((item) => {
                    const due = new Date(`${item.nextDueDate}T23:59:59`); const days = Math.ceil((due - now) / 86400000);
                    if (days < 0) createNotification(currentUser.email, "vaccination", "Vaccination overdue", `${item.petName}: ${item.vaccineName} was due on ${item.nextDueDate}. Contact your veterinarian.`, item.id, `vax-overdue:${item.id}:${item.nextDueDate}`);
                    else if (days <= 30) createNotification(currentUser.email, "vaccination", "Vaccination coming due", `${item.petName}: ${item.vaccineName} is due on ${item.nextDueDate}.`, item.id, `vax-due:${item.id}:${item.nextDueDate}`);
                });
            }
        };
        generateCareReminders();
        renderNotifications();

        /* ADMIN DASHBOARD — LOCAL PREVIEW */
        const renderAdminDashboard = () => {
            if (!isAdmin) return;
            const users = readLocalArray("woofyUsers"); const pets = readLocalArray("woofyPets"); const appointments = readLocalArray("woofyAppointments");
            const stats = document.querySelector("#adminStatGrid");
            if (stats) { stats.replaceChildren(); [["Registered users", users.length, "👥"], ["Pet parents", users.filter((u) => u.role === "pet_parent").length, "🐾"], ["Veterinarians", users.filter((u) => u.role === "veterinarian").length, "🩺"], ["Pets", pets.length, "🐶"], ["Appointments", appointments.length, "🗓️"], ["Pending vet reviews", users.filter((u) => u.role === "veterinarian" && u.vetApproval === "pending").length, "⏳"]].forEach(([label,value,emoji]) => { const card = document.createElement("div"); card.className = "admin-stat-card"; const icon = document.createElement("span"); icon.textContent = emoji; const number = document.createElement("strong"); number.textContent = String(value); const caption = document.createElement("small"); caption.textContent = label; card.append(icon,number,caption); stats.appendChild(card); }); }
            const userList = document.querySelector("#adminUsersList");
            if (userList) { userList.replaceChildren(); const table = document.createElement("table"); table.className = "admin-table"; table.innerHTML = "<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>"; const tbody = document.createElement("tbody"); users.forEach((user) => { const tr = document.createElement("tr"); [user.name, user.email, user.role.replace("_", " ")].forEach((value) => { const td = document.createElement("td"); td.textContent = value; tr.appendChild(td); }); const status = document.createElement("td"); const label = user.status === "suspended" ? "Suspended" : user.role === "veterinarian" && user.vetApproval === "pending" ? "Pending review" : user.role === "veterinarian" && user.vetApproval === "rejected" ? "Review declined" : "Active"; status.textContent = label; tr.appendChild(status); const actions = document.createElement("td"); actions.className = "admin-table-actions"; if (user.role === "veterinarian" && user.vetApproval === "pending") { const approve = document.createElement("button"); approve.type = "button"; approve.className = "btn btn-dark btn-small"; approve.textContent = "Approve"; approve.addEventListener("click", () => updateAdminUser(user.email, { vetApproval: "approved", status: "active" })); const reject = document.createElement("button"); reject.type = "button"; reject.className = "btn btn-light btn-small"; reject.textContent = "Reject"; reject.addEventListener("click", () => updateAdminUser(user.email, { vetApproval: "rejected" })); actions.append(approve,reject); } else if (user.role !== "administrator" || user.email !== currentUser.email) { const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "btn btn-light btn-small"; toggle.textContent = user.status === "suspended" ? "Reactivate" : "Suspend"; toggle.addEventListener("click", () => updateAdminUser(user.email, { status: user.status === "suspended" ? "active" : "suspended" })); actions.appendChild(toggle); } else actions.textContent = "Current account"; tr.appendChild(actions); tbody.appendChild(tr); }); table.appendChild(tbody); userList.appendChild(table); }
            const appointmentList = document.querySelector("#adminAppointmentsList");
            if (appointmentList) { appointmentList.replaceChildren(); const table = document.createElement("table"); table.className = "admin-table"; table.innerHTML = "<thead><tr><th>Pet / parent</th><th>Veterinarian</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>"; const tbody = document.createElement("tbody"); appointments.slice().sort((a,b) => new Date(b.createdAt || b.dateTime) - new Date(a.createdAt || a.dateTime)).forEach((item) => { const tr = document.createElement("tr"); [ `${item.petName || "Pet"} / ${item.parentName || item.parentEmail}`, item.vetName || item.vetEmail, new Date(item.dateTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }), item.status || "pending" ].forEach((value) => { const td = document.createElement("td"); td.textContent = value; tr.appendChild(td); }); const actions = document.createElement("td"); actions.className = "admin-table-actions"; if (["pending", "accepted"].includes(item.status || "pending")) { [ ["Confirm","accepted"], ["Cancel","cancelled"] ].forEach(([label,status]) => { const button = document.createElement("button"); button.type = "button"; button.className = "btn btn-light btn-small"; button.textContent = label; button.addEventListener("click", () => updateAdminAppointment(item.id,status)); actions.appendChild(button); }); } else actions.textContent = "—"; tr.appendChild(actions); tbody.appendChild(tr); }); table.appendChild(tbody); appointmentList.appendChild(table); }
            const activity = document.querySelector("#adminRecentActivity");
            if (activity) { activity.replaceChildren(); const recent = [...appointments].sort((a,b) => new Date(b.createdAt || b.dateTime) - new Date(a.createdAt || a.dateTime)).slice(0,6); if (!recent.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No platform activity yet."; activity.appendChild(empty); } else recent.forEach((item) => { const row = document.createElement("p"); row.textContent = `${item.petName || "A pet"} · ${item.status || "pending"} appointment with ${item.vetName || item.vetEmail || "a veterinarian"}`; activity.appendChild(row); }); }
        };
        const updateAdminUser = async (email, changes) => {
            const users = readLocalArray("woofyUsers"); const user = users.find((item) => item.email === email); if (!user) return;
            const apiChanges = {};
            if (changes.status) apiChanges.status = changes.status;
            if (changes.vetApproval) apiChanges.vet_approval = changes.vetApproval;
            try {
                const updated = await apiRequest(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(apiChanges) });
                Object.assign(user, { status: updated.status, vetApproval: updated.vetApproval });
                saveLocalArray("woofyUsers", users); renderAdminDashboard();
                showMessage("Account updated successfully.");
            } catch (error) { showApiError(error); }
        };
        const updateAdminAppointment = async (id, status) => {
            const items = readLocalArray("woofyAppointments"); const item = items.find((entry) => entry.id === id); if (!item) return;
            try {
                await apiRequest(`/api/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status: status === "accepted" ? "accepted" : "cancelled" }) });
                item.status = status; item.updatedAt = new Date().toISOString(); saveAppointments(items); renderAdminDashboard();
                showMessage("Appointment updated.");
            } catch (error) { showApiError(error); }
        };
        if (isAdmin) {
            renderAdminDashboard();
            document.querySelector("#adminAnnouncementForm")?.addEventListener("submit", async (event) => { event.preventDefault(); const title = document.querySelector("#adminAnnouncementTitle").value.trim(); const message = document.querySelector("#adminAnnouncementMessage").value.trim(); if (!title || !message) return; try { await apiRequest("/api/admin/announcements", { method: "POST", body: JSON.stringify({ title, body: message }) }); event.target.reset(); const refreshed = await apiRequest("/api/notifications"); localStorage.setItem("woofyNotifications", JSON.stringify(refreshed.map((item) => ({ id: item.id, recipientEmail: currentUser.email, type: item.kind, title: item.title, message: item.body, relatedId: item.related_id, sourceKey: item.source_key, read: item.is_read, createdAt: item.created_at })))); renderNotifications(); showMessage("Announcement posted."); } catch (error) { showApiError(error); } });
        }
        let refreshAppointmentPetOptions = () => {};
        let refreshContactPetOptions = () => {};
        let refreshWoofyPetContextOptions = () => {};
        let pets = readLocalArray("woofyPets");
        let editingPetId = null;
        let selectedPetPhoto = "";
        if (currentUser.role === "pet_parent") {
            pets = pets.filter((pet) => pet.ownerEmail === currentUser.email);
        }
        const petEmoji = (type) => ({
            Dog: "🐶", Cat: "🐱", Bird: "🦜", Rabbit: "🐰", Hamster: "🐹",
            "Guinea pig": "🐹", Ferret: "🦦", Reptile: "🦎", Turtle: "🐢",
            Fish: "🐠", Horse: "🐴", Goat: "🐐", Sheep: "🐑", Pig: "🐷",
            Chicken: "🐔", Duck: "🦆"
        })[type] || "🐾";
        const resetPetEditor = () => {
            editingPetId = null;
            selectedPetPhoto = "";
            petForm?.reset();
            if (petPhotoPreview) { petPhotoPreview.removeAttribute("src"); petPhotoPreview.hidden = true; }
            if (petCustomTypeInput) { petCustomTypeInput.value = ""; petCustomTypeInput.hidden = true; petCustomTypeInput.required = false; }
            if (petTypeSelect) petTypeSelect.value = "";
            if (savePetButton) savePetButton.textContent = "Save pet";
            if (cancelPetEditButton) cancelPetEditButton.hidden = true;
        };
        const syncCustomPetTypeField = () => {
            const isOther = petTypeSelect?.value === "Other";
            if (petCustomTypeInput) {
                petCustomTypeInput.hidden = !isOther;
                petCustomTypeInput.required = Boolean(isOther);
                if (!isOther) petCustomTypeInput.value = "";
            }
        };
        petTypeSelect?.addEventListener("change", syncCustomPetTypeField);
        const standardPetTypes = ["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Guinea pig", "Ferret", "Reptile", "Turtle", "Fish", "Horse", "Goat", "Sheep", "Pig", "Chicken", "Duck"];
        const openPetEditor = (pet) => {
            editingPetId = pet.id;
            document.querySelector("#petName").value = pet.name || "";
            const isCustomPetType = pet.typeCategory === "Other" || (pet.type && !standardPetTypes.includes(pet.type));
            petTypeSelect.value = isCustomPetType ? "Other" : (pet.type || "");
            if (petCustomTypeInput) petCustomTypeInput.value = isCustomPetType ? (pet.customType || pet.type || "") : "";
            syncCustomPetTypeField();
            document.querySelector("#petBreed").value = pet.breed || "";
            document.querySelector("#petAge").value = pet.age ?? "";
            document.querySelector("#petWeight").value = pet.weight ?? "";
            document.querySelector("#petNotes").value = pet.notes || "";
            selectedPetPhoto = pet.photo || "";
            if (petPhotoPreview) {
                if (selectedPetPhoto) { petPhotoPreview.src = selectedPetPhoto; petPhotoPreview.hidden = false; }
                else { petPhotoPreview.removeAttribute("src"); petPhotoPreview.hidden = true; }
            }
            petForm.hidden = false;
            if (savePetButton) savePetButton.textContent = "Save changes";
            if (cancelPetEditButton) cancelPetEditButton.hidden = false;
            petForm.scrollIntoView({ behavior: "smooth", block: "center" });
            document.querySelector("#petName")?.focus({ preventScroll: true });
        };
        const renderPets = () => {
            if (!petList) return;
            petList.replaceChildren();
            if (!pets.length) {
                const empty = document.createElement("p"); empty.className = "empty-state";
                empty.textContent = "No pets just yet. Add your first furry (or feathered!) friend above.";
                petList.appendChild(empty); return;
            }
            pets.forEach((pet) => {
                const tile = document.createElement("article"); tile.className = "pet-tile saved-pet-tile";
                let avatar;
                if (pet.photo) {
                    avatar = document.createElement("img"); avatar.className = "pet-profile-photo";
                    avatar.src = pet.photo; avatar.alt = `${pet.name}'s profile`; avatar.loading = "lazy";
                } else {
                    avatar = document.createElement("span"); avatar.className = "pet-emoji"; avatar.textContent = petEmoji(pet.type);
                }
                const details = document.createElement("div"); details.className = "pet-tile-details";
                const name = document.createElement("strong"); name.textContent = pet.name;
                const description = document.createElement("small");
                description.textContent = [pet.type, pet.breed, pet.age !== "" && pet.age != null ? `${pet.age} yrs` : "", pet.weight != null && pet.weight !== "" ? `${pet.weight} kg` : ""].filter(Boolean).join(" · ");
                details.append(name, description);
                if (pet.notes) { const note = document.createElement("p"); note.className = "pet-note"; note.textContent = pet.notes; details.appendChild(note); }
                const actions = document.createElement("div"); actions.className = "pet-tile-actions";
                const view = document.createElement("button"); view.type = "button"; view.className = "btn btn-dark pet-action"; view.textContent = "View dashboard →";
                view.addEventListener("click", () => openPetDashboard(pet));
                const edit = document.createElement("button"); edit.type = "button"; edit.className = "btn btn-light pet-action"; edit.textContent = "Edit";
                edit.addEventListener("click", () => openPetEditor(pet));
                const remove = document.createElement("button"); remove.type = "button"; remove.className = "btn btn-light pet-action"; remove.textContent = "Delete";
                remove.addEventListener("click", async () => {
                    if (!window.confirm(`Delete ${pet.name}'s profile? Pets with existing appointment or medical history cannot be deleted.`)) return;
                    try {
                        await apiRequest(`/api/pets/${pet.id}`, { method: "DELETE" });
                        saveLocalArray("woofyPets", readLocalArray("woofyPets").filter((item) => item.id !== pet.id));
                        pets = pets.filter((item) => item.id !== pet.id); renderPets(); refreshAppointmentPetOptions(); refreshContactPetOptions(); refreshWoofyPetContextOptions(); renderParentMedicalRecords();
                        showMessage(`${pet.name}'s profile was deleted.`);
                    } catch (error) { showApiError(error); }
                });
                actions.append(view, edit, remove); tile.append(avatar, details, actions); petList.appendChild(tile);
            });
        };
        if (petPhotoInput) {
            petPhotoInput.addEventListener("change", () => {
                const file = petPhotoInput.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) { showMessage("Please choose an image file.", "error"); petPhotoInput.value = ""; return; }
                if (file.size > 2 * 1024 * 1024) { showMessage("Please choose an image smaller than 2 MB.", "error"); petPhotoInput.value = ""; return; }
                const reader = new FileReader();
                reader.onload = () => {
                    selectedPetPhoto = String(reader.result || "");
                    if (petPhotoPreview) { petPhotoPreview.src = selectedPetPhoto; petPhotoPreview.hidden = false; }
                };
                reader.onerror = () => showMessage("That photo could not be loaded. Please try another.", "error");
                reader.readAsDataURL(file);
            });
        }
        if (petForm && showPetFormButton && petList && !isVeterinarian) {
            renderPets();
            showPetFormButton.addEventListener("click", () => {
                if (!petForm.hidden && !editingPetId) { petForm.hidden = true; return; }
                if (editingPetId) resetPetEditor();
                petForm.hidden = false;
                if (savePetButton) savePetButton.textContent = "Save pet";
                if (cancelPetEditButton) cancelPetEditButton.hidden = true;
                document.querySelector("#petName")?.focus();
            });
            cancelPetEditButton?.addEventListener("click", () => { resetPetEditor(); petForm.hidden = true; });
            petForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const name = document.querySelector("#petName").value.trim();
                const selectedType = petTypeSelect.value;
                const customType = petCustomTypeInput?.value.trim() || "";
                if (selectedType === "Other" && !customType) {
                    petCustomTypeInput?.focus();
                    showMessage("Tell us what kind of animal your pet is. 🐾", "error");
                    return;
                }
                const type = selectedType === "Other" ? customType : selectedType;
                const breed = document.querySelector("#petBreed").value.trim();
                const ageValue = document.querySelector("#petAge").value;
                const weightValue = document.querySelector("#petWeight").value;
                const notes = document.querySelector("#petNotes").value.trim();
                const weight = weightValue === "" ? "" : Number(weightValue);
                if (!name || !type) return;
                if (weightValue !== "" && (!Number.isFinite(weight) || weight <= 0 || weight > 300)) {
                    showMessage("Please enter a weight between 0.1 and 300 kg.", "error"); return;
                }
                const existing = editingPetId ? pets.find((item) => item.id === editingPetId) : null;
                const apiPayload = {
                    name, animal_type: type, breed: breed || null,
                    age_years: ageValue === "" ? null : Number(ageValue),
                    weight_kg: weightValue === "" ? null : weight,
                    notes: notes || null, photo_data: selectedPetPhoto || existing?.photo || null
                };
                const wasEditing = Boolean(existing);
                const submitButton = savePetButton;
                if (submitButton) submitButton.disabled = true;
                try {
                    const saved = await apiRequest(existing ? `/api/pets/${existing.id}` : "/api/pets", {
                        method: existing ? "PATCH" : "POST", body: JSON.stringify(apiPayload)
                    });
                    const pet = { id: saved.id, ownerId: saved.owner_id, ownerEmail: currentUser.email, ownerName: currentUser.name,
                        name: saved.name, type: saved.animal_type, typeCategory: selectedType, customType: selectedType === "Other" ? customType : "",
                        breed: saved.breed || "", age: saved.age_years ?? "", weight: saved.weight_kg ?? "", notes: saved.notes || "", photo: saved.photo_data || "", createdAt: saved.created_at };
                    if (existing) pets = pets.map((item) => item.id === editingPetId ? pet : item);
                    else pets.push(pet);
                    saveLocalArray("woofyPets", [...readLocalArray("woofyPets").filter((item) => item.ownerEmail !== currentUser.email), ...pets]);
                    resetPetEditor(); petForm.hidden = true; renderPets(); refreshAppointmentPetOptions(); refreshContactPetOptions(); refreshWoofyPetContextOptions();
                    if (wasEditing) renderParentMedicalRecords();
                    showMessage(wasEditing ? `${name}'s profile has been updated!` : `${name} has joined the woofy crew! 🐾`);
                } catch (error) { showApiError(error); }
                finally { if (submitButton) submitButton.disabled = false; }
            });
        }

        /* ================================
           APPOINTMENT MANAGEMENT — FRONTEND DEMO
        ================================= */

        const appointmentForm = document.querySelector("#appointmentForm");
        const parentAppointmentList = document.querySelector("#parentAppointmentList");
        const vetAppointmentList = document.querySelector("#vetAppointmentList");
        const appointmentPetSelect = document.querySelector("#appointmentPet");
        const appointmentVetSelect = document.querySelector("#appointmentVet");
        const appointmentDateInput = document.querySelector("#appointmentDate");
        const appointmentHint = document.querySelector("#appointmentFormHint");
        const appointmentAvailabilityHint = document.querySelector("#appointmentAvailabilityHint");

        const saveAppointments = (items) => {
            localStorage.setItem("woofyAppointments", JSON.stringify(items));
        };

        const formatAppointmentDate = (value) => {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "Date to be confirmed";
            return date.toLocaleString([], {
                weekday: "short", month: "short", day: "numeric",
                hour: "numeric", minute: "2-digit"
            });
        };

        const statusLabel = (status) => ({
            pending: "Pending review",
            accepted: "Confirmed",
            rejected: "Not available",
            cancelled: "Cancelled"
        }[status] || "Pending review");

        const makeAppointmentCard = (appointment, showActions = false, allowParentCancel = false) => {
            const card = document.createElement("article");
            card.className = "appointment-request-card";

            const heading = document.createElement("div");
            heading.className = "appointment-request-heading";
            const title = document.createElement("strong");
            title.textContent = `${appointment.petName} · ${appointment.parentName}`;
            const status = document.createElement("span");
            status.className = `appointment-status ${appointment.status || "pending"}`;
            status.textContent = statusLabel(appointment.status);
            heading.append(title, status);

            const details = document.createElement("p");
            details.className = "appointment-request-meta";
            details.textContent = `${formatAppointmentDate(appointment.dateTime)} · ${appointment.vetName}`;

            const reason = document.createElement("p");
            reason.className = "appointment-request-reason";
            reason.textContent = appointment.reason;
            card.append(heading, details, reason);

            if (showActions && appointment.status === "pending") {
                const actions = document.createElement("div");
                actions.className = "appointment-actions";
                const accept = document.createElement("button");
                accept.type = "button";
                accept.className = "btn btn-dark";
                accept.textContent = "Accept";
                accept.addEventListener("click", () => updateAppointmentStatus(appointment.id, "accepted"));
                const reject = document.createElement("button");
                reject.type = "button";
                reject.className = "btn btn-light";
                reject.textContent = "Decline";
                reject.addEventListener("click", () => updateAppointmentStatus(appointment.id, "rejected"));
                actions.append(accept, reject);
                card.appendChild(actions);
            }

            const appointmentIsFuture = Number.isFinite(new Date(appointment.dateTime).getTime()) && new Date(appointment.dateTime).getTime() > Date.now();
            if (allowParentCancel && appointmentIsFuture && ["pending", "accepted"].includes(appointment.status || "pending")) {
                const actions = document.createElement("div");
                actions.className = "appointment-actions";
                const cancel = document.createElement("button");
                cancel.type = "button";
                cancel.className = "btn btn-light";
                cancel.textContent = "Cancel appointment";
                cancel.addEventListener("click", () => cancelParentAppointment(appointment.id));
                actions.appendChild(cancel);
                card.appendChild(actions);
            }

            return card;
        };

        const renderParentAppointments = () => {
            if (!parentAppointmentList) return;
            const mine = readLocalArray("woofyAppointments")
                .filter((item) => item.parentEmail === currentUser.email)
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            parentAppointmentList.replaceChildren();
            if (!mine.length) {
                const empty = document.createElement("p");
                empty.className = "empty-state";
                empty.textContent = "No requests yet. Your next vet visit can start here!";
                parentAppointmentList.appendChild(empty);
                return;
            }
            mine.forEach((item) => parentAppointmentList.appendChild(makeAppointmentCard(item, false, true)));
        };

        const renderVetAppointments = () => {
            if (!vetAppointmentList) return;
            const mine = readLocalArray("woofyAppointments")
                .filter((item) => item.vetEmail === currentUser.email)
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            vetAppointmentList.replaceChildren();
            if (!mine.length) {
                const empty = document.createElement("p");
                empty.className = "empty-state";
                empty.textContent = "Your appointment inbox is empty for now.";
                vetAppointmentList.appendChild(empty);
                return;
            }
            mine.forEach((item) => vetAppointmentList.appendChild(makeAppointmentCard(item, true)));
        };

        /* VETERINARIAN WEEKLY SCHEDULE — BROWSER PREVIEW */
        const vetWeeklyScheduleForm = document.querySelector("#vetWeeklyScheduleForm");
        const vetScheduleStatus = document.querySelector("#vetScheduleStatus");
        const vetScheduleAppointments = document.querySelector("#vetScheduleAppointments");
        const vetScheduleSummary = document.querySelector("#vetScheduleSummary");
        const cancelVetScheduleEdit = document.querySelector("#cancelVetScheduleEdit");
        const vetScheduleKey = `woofyVetSchedule:${currentUser.email}`;
        const scheduleDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const readVetSchedule = () => {
            try {
                const saved = JSON.parse(localStorage.getItem(vetScheduleKey) || "null");
                return saved && saved.days ? saved : null;
            } catch { return null; }
        };
        const formatScheduleTime = (value) => {
            if (!value) return "";
            const [hours, minutes] = value.split(":").map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        };
        const showScheduleEditor = (editing = false) => {
            if (!vetWeeklyScheduleForm) return;
            vetWeeklyScheduleForm.hidden = false;
            if (vetScheduleSummary) vetScheduleSummary.hidden = true;
            if (cancelVetScheduleEdit) cancelVetScheduleEdit.hidden = !readVetSchedule();
            if (vetScheduleStatus) vetScheduleStatus.textContent = editing ? "Update your clinic days or hours, then save your changes." : "Choose your available days and save.";
        };
        const renderVetSchedule = () => {
            if (!vetWeeklyScheduleForm) return;
            const saved = readVetSchedule();
            scheduleDays.forEach((day) => {
                const enabled = vetWeeklyScheduleForm.elements.namedItem(`${day}-enabled`);
                const opening = vetWeeklyScheduleForm.elements.namedItem(`${day}-open`);
                const closing = vetWeeklyScheduleForm.elements.namedItem(`${day}-close`);
                const values = saved?.days?.[day];
                if (enabled) enabled.checked = Boolean(values?.enabled);
                if (opening) opening.value = values?.open || "09:00";
                if (closing) closing.value = values?.close || "17:00";
            });
            if (saved) {
                const rows = scheduleDays.filter((day) => saved.days[day]?.enabled).map((day) => {
                    const row = document.createElement("div");
                    row.className = "vet-schedule-summary-row";
                    const dayName = document.createElement("strong");
                    dayName.textContent = day.charAt(0).toUpperCase() + day.slice(1);
                    const hours = document.createElement("span");
                    hours.textContent = `${formatScheduleTime(saved.days[day].open)} – ${formatScheduleTime(saved.days[day].close)}`;
                    row.append(dayName, hours);
                    return row;
                });
                if (vetScheduleSummary) {
                    vetScheduleSummary.replaceChildren();
                    const header = document.createElement("div");
                    header.className = "vet-schedule-summary-header";
                    const title = document.createElement("div");
                    title.innerHTML = "<strong>Your published clinic hours</strong><span>Pet parents can request appointments during these times.</span>";
                    const edit = document.createElement("button");
                    edit.type = "button";
                    edit.className = "btn btn-light";
                    edit.textContent = "Edit schedule";
                    edit.addEventListener("click", () => showScheduleEditor(true));
                    header.append(title, edit);
                    const list = document.createElement("div");
                    list.className = "vet-schedule-summary-list";
                    rows.forEach((row) => list.appendChild(row));
                    vetScheduleSummary.append(header, list);
                    vetScheduleSummary.hidden = false;
                }
                vetWeeklyScheduleForm.hidden = true;
                if (vetScheduleStatus) vetScheduleStatus.textContent = "Your clinic hours have been saved.";
            } else {
                if (vetScheduleSummary) vetScheduleSummary.hidden = true;
                vetWeeklyScheduleForm.hidden = false;
                if (vetScheduleStatus) vetScheduleStatus.textContent = "No clinic hours saved yet. Select your available days and save.";
            }
        };
        const renderVetScheduleAppointments = () => {
            if (!vetScheduleAppointments) return;
            const upcoming = readLocalArray("woofyAppointments")
                .filter((item) => item.vetEmail === currentUser.email
                    && ["pending", "accepted"].includes(item.status || "pending")
                    && Number.isFinite(new Date(item.dateTime).getTime())
                    && new Date(item.dateTime).getTime() >= Date.now())
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            vetScheduleAppointments.replaceChildren();
            if (!upcoming.length) {
                const empty = document.createElement("p");
                empty.className = "empty-state";
                empty.textContent = "No upcoming appointments yet. New requests will appear here.";
                vetScheduleAppointments.appendChild(empty);
                return;
            }
            upcoming.forEach((item) => vetScheduleAppointments.appendChild(makeAppointmentCard(item, false)));
        };
        if (vetWeeklyScheduleForm && isVeterinarian) {
            renderVetSchedule();
            renderVetScheduleAppointments();
            if (cancelVetScheduleEdit) cancelVetScheduleEdit.addEventListener("click", () => renderVetSchedule());
            vetWeeklyScheduleForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const days = {};
                let enabledCount = 0;
                for (const day of scheduleDays) {
                    const enabled = vetWeeklyScheduleForm.elements.namedItem(`${day}-enabled`).checked;
                    const open = vetWeeklyScheduleForm.elements.namedItem(`${day}-open`).value;
                    const close = vetWeeklyScheduleForm.elements.namedItem(`${day}-close`).value;
                    if (enabled) {
                        enabledCount += 1;
                        if (!open || !close || close <= open) {
                            showMessage(`Please check the opening and closing times for ${day}.`, "error");
                            return;
                        }
                    }
                    days[day] = { enabled, open, close };
                }
                if (!enabledCount) {
                    showMessage("Choose at least one day when your clinic is available.", "error");
                    return;
                }
                try {
                    await apiRequest("/api/vets/me/schedule", { method: "PUT", body: JSON.stringify({ days }) });
                    localStorage.setItem(vetScheduleKey, JSON.stringify({ days, updatedAt: new Date().toISOString() }));
                    renderVetSchedule();
                    showMessage("Your clinic schedule has been saved. 🐾");
                } catch (error) { showApiError(error); }
            });
        }

        const updateAppointmentStatus = async (appointmentId, status) => {
            const appointments = readLocalArray("woofyAppointments");
            const appointment = appointments.find((item) => item.id === appointmentId && item.vetEmail === currentUser.email);
            if (!appointment || !["accepted", "rejected"].includes(status)) return;
            try { await apiRequest(`/api/appointments/${appointmentId}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
            catch (error) { showApiError(error); return; }
            appointment.status = status;
            appointment.updatedAt = new Date().toISOString();
            saveAppointments(appointments);
            renderVetAppointments();
            renderVetScheduleAppointments();
            showMessage(status === "accepted" ? "Appointment confirmed! 🐾" : "Appointment declined.");
            if (status === "accepted") setTimeout(() => window.location.reload(), 650);
        };

        const appointmentCancelDialog = document.querySelector("#appointmentCancelDialog");
        const appointmentCancelMessage = document.querySelector("#appointmentCancelMessage");
        const keepAppointmentButton = document.querySelector("#keepAppointmentButton");
        const confirmCancelAppointmentButton = document.querySelector("#confirmCancelAppointmentButton");
        let resolveAppointmentCancel = null;
        if (appointmentCancelDialog) {
            appointmentCancelDialog.addEventListener("close", () => {
                if (resolveAppointmentCancel) {
                    resolveAppointmentCancel(appointmentCancelDialog.returnValue === "confirm");
                    resolveAppointmentCancel = null;
                }
            });
            keepAppointmentButton?.addEventListener("click", () => appointmentCancelDialog.close("keep"));
            confirmCancelAppointmentButton?.addEventListener("click", () => appointmentCancelDialog.close("confirm"));
            appointmentCancelDialog.addEventListener("click", (event) => {
                if (event.target === appointmentCancelDialog) appointmentCancelDialog.close("keep");
            });
        }
        const askToCancelAppointment = (petName) => new Promise((resolve) => {
            if (!appointmentCancelDialog || typeof appointmentCancelDialog.showModal !== "function") {
                resolve(false);
                return;
            }
            if (appointmentCancelMessage) appointmentCancelMessage.textContent = `Are you sure you want to cancel the appointment for ${petName}? This will update its status for your veterinarian too.`;
            resolveAppointmentCancel = resolve;
            appointmentCancelDialog.showModal();
        });

        const cancelParentAppointment = async (appointmentId) => {
            const appointments = readLocalArray("woofyAppointments");
            const appointment = appointments.find((item) => item.id === appointmentId && item.parentEmail === currentUser.email);
            if (!appointment || !["pending", "accepted"].includes(appointment.status || "pending") || new Date(appointment.dateTime).getTime() <= Date.now()) {
                showMessage("Only upcoming pending or confirmed appointments can be cancelled.", "error");
                return;
            }
            const confirmed = await askToCancelAppointment(appointment.petName || "your pet");
            if (!confirmed) return;
            try { await apiRequest(`/api/appointments/${appointmentId}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) }); }
            catch (error) { showApiError(error); return; }
            appointment.status = "cancelled";
            appointment.cancelledAt = new Date().toISOString();
            appointment.updatedAt = appointment.cancelledAt;
            saveAppointments(appointments);
            renderParentAppointments();
            renderVetAppointments();
            renderVetScheduleAppointments();
            if (activePetDashboardPet) openPetDashboard(activePetDashboardPet);
            showMessage("Appointment cancelled. The vet can see the updated status.");
        };

        if (appointmentForm && appointmentPetSelect && appointmentVetSelect) {
            const bookingPets = readLocalArray("woofyPets").filter((pet) => pet.ownerEmail === currentUser.email);
            const veterinarians = readLocalArray("woofyUsers")
                .filter((user) => user.role === "veterinarian" && user.status !== "suspended" && (user.vetApproval || "approved") === "approved");

            refreshAppointmentPetOptions = () => {
                appointmentPetSelect.replaceChildren(new Option("Choose your pet", ""));
                readLocalArray("woofyPets").filter((pet) => pet.ownerEmail === currentUser.email).forEach((pet) => {
                    const option = new Option(pet.name, pet.id);
                    option.dataset.petName = pet.name;
                    appointmentPetSelect.appendChild(option);
                });
            };
            refreshAppointmentPetOptions();

            veterinarians.forEach((vet) => {
                const option = document.createElement("option");
                option.value = vet.email;
                option.dataset.vetId = String(vet.id);
                option.textContent = vet.name;
                appointmentVetSelect.appendChild(option);
            });

            // datetime-local expects the browser's local clock, not UTC.
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            appointmentDateInput.min = now.toISOString().slice(0, 16);

            if (!bookingPets.length) {
                appointmentHint.textContent = "Add your pet's profile above before requesting an appointment.";
            } else if (!veterinarians.length) {
                appointmentHint.textContent = "No veterinarian accounts yet. Register a veterinarian account, then come back to book.";
            }

            const readPublishedVetSchedule = (vetEmail) => {
                if (!vetEmail) return null;
                try {
                    const saved = JSON.parse(localStorage.getItem(`woofyVetSchedule:${vetEmail}`) || "null");
                    return saved?.days ? saved : null;
                } catch { return null; }
            };
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const formatClinicTime = (value) => {
                if (!value) return "";
                const [hours, minutes] = value.split(":").map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
            };
            const checkBookingAvailability = (vetEmail, dateTime) => {
                const schedule = readPublishedVetSchedule(vetEmail);
                if (!schedule) return { available: false, message: "This veterinarian hasn't published clinic hours yet, so appointments can't be requested yet." };
                if (!dateTime) return { available: null, message: "Choose a date and time to check this veterinarian's availability." };

                const selectedDate = new Date(dateTime);
                if (!Number.isFinite(selectedDate.getTime())) return { available: false, message: "Please choose a valid appointment date and time." };
                const dayKey = dayNames[selectedDate.getDay()].toLowerCase();
                const dayHours = schedule.days[dayKey];
                const selectedTime = dateTime.slice(11, 16);
                if (!dayHours?.enabled) return { available: false, message: `The clinic is closed on ${dayNames[selectedDate.getDay()]}s. Please choose another day.` };
                if (selectedTime < dayHours.open || selectedTime >= dayHours.close) {
                    return { available: false, message: `Clinic hours on ${dayNames[selectedDate.getDay()]} are ${formatClinicTime(dayHours.open)}–${formatClinicTime(dayHours.close)}. Choose a time within these hours.` };
                }

                const occupied = readLocalArray("woofyAppointments").some((item) =>
                    item.vetEmail === vetEmail && item.dateTime === dateTime
                    && ["pending", "accepted"].includes(item.status || "pending")
                );
                if (occupied) return { available: false, message: "That time already has an appointment request. Please choose another time." };
                return { available: true, message: `Available on ${dayNames[selectedDate.getDay()]} · ${formatClinicTime(dayHours.open)}–${formatClinicTime(dayHours.close)}. This time is available to request.` };
            };
            const updateAppointmentAvailabilityHint = () => {
                if (!appointmentAvailabilityHint) return;
                const vetEmail = appointmentVetSelect.value;
                const title = document.createElement("span");
                title.className = "availability-title";
                title.textContent = "Vet availability";
                const message = document.createElement("span");
                message.className = "availability-message";
                const daysWrap = document.createElement("div");
                daysWrap.className = "availability-day-list";
                appointmentAvailabilityHint.replaceChildren(title, message, daysWrap);
                if (!vetEmail) {
                    message.textContent = "Choose a veterinarian to view their published clinic hours.";
                    appointmentAvailabilityHint.dataset.state = "neutral";
                    return;
                }
                const schedule = readPublishedVetSchedule(vetEmail);
                if (!schedule) {
                    message.textContent = "This veterinarian hasn't published clinic hours yet.";
                    appointmentAvailabilityHint.dataset.state = "unavailable";
                    return;
                }
                const selectedDateTime = appointmentDateInput.value;
                if (selectedDateTime) {
                    const result = checkBookingAvailability(vetEmail, selectedDateTime);
                    message.textContent = result.message;
                    appointmentAvailabilityHint.dataset.state = result.available ? "available" : "unavailable";
                } else {
                    const publishedDays = scheduleDays.filter((day) => schedule.days[day]?.enabled);
                    if (!publishedDays.length) {
                        message.textContent = "This veterinarian has no available clinic days at the moment.";
                        appointmentAvailabilityHint.dataset.state = "unavailable";
                        return;
                    }
                    message.textContent = "Published weekly clinic hours";
                    publishedDays.forEach((day) => {
                        const chip = document.createElement("span");
                        chip.className = "availability-day-chip";
                        const dayLabel = day.charAt(0).toUpperCase() + day.slice(1, 3);
                        chip.textContent = `${dayLabel} · ${formatClinicTime(schedule.days[day].open)}–${formatClinicTime(schedule.days[day].close)}`;
                        daysWrap.appendChild(chip);
                    });
                    appointmentAvailabilityHint.dataset.state = "neutral";
                }
            };
            appointmentVetSelect.addEventListener("change", updateAppointmentAvailabilityHint);
            appointmentDateInput.addEventListener("change", updateAppointmentAvailabilityHint);
            appointmentDateInput.addEventListener("input", updateAppointmentAvailabilityHint);
            updateAppointmentAvailabilityHint();

            appointmentForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const selectedPet = appointmentPetSelect.selectedOptions[0];
                const vet = veterinarians.find((item) => item.email === appointmentVetSelect.value);
                const dateTime = appointmentDateInput.value;
                const reason = document.querySelector("#appointmentReason").value.trim();

                if (!selectedPet || !selectedPet.value || !vet || !dateTime || !reason) {
                    showMessage("Choose your pet, a vet, a date and a reason first.", "error");
                    return;
                }
                if (new Date(dateTime).getTime() <= Date.now()) {
                    showMessage("Please choose a future date and time.", "error");
                    return;
                }
                const availability = checkBookingAvailability(vet.email, dateTime);
                updateAppointmentAvailabilityHint();
                if (!availability.available) {
                    showMessage(availability.message, "error");
                    return;
                }

                try {
                    const saved = await apiRequest("/api/appointments", { method: "POST", body: JSON.stringify({
                        pet_id: Number(selectedPet.value), vet_id: Number(appointmentVetSelect.selectedOptions[0]?.dataset.vetId || vet.id),
                        date_time: new Date(dateTime).toISOString(), reason
                    }) });
                    const appointments = readLocalArray("woofyAppointments");
                    appointments.push({ id: saved.id, parentEmail: currentUser.email, parentName: currentUser.name,
                        petId: Number(selectedPet.value), petName: selectedPet.dataset.petName || selectedPet.textContent,
                        vetEmail: vet.email, vetName: vet.name, dateTime: saved.date_time || new Date(dateTime).toISOString(), reason, status: saved.status || "pending", createdAt: saved.created_at });
                    saveAppointments(appointments);
                    appointmentForm.reset();
                    appointmentDateInput.min = now.toISOString().slice(0, 16);
                    renderParentAppointments();
                    updateAppointmentAvailabilityHint();
                    showMessage("Appointment request sent to your vet! 🐶");
                } catch (error) { showApiError(error); }
            });
            renderParentAppointments();
        }

        if (vetAppointmentList) renderVetAppointments();

        /* PET MEDICAL RECORDS — FRONTEND DEMO */
        const parentMedicalRecords = document.querySelector("#parentMedicalRecords");
        const vetMedicalRecords = document.querySelector("#vetMedicalRecords");
        const medicalRecordForm = document.querySelector("#medicalRecordForm");
        const recordPetSelect = document.querySelector("#recordPet");
        const vetPatientList = document.querySelector("#vetPatientList");
        const readMedicalRecords = () => readLocalArray("woofyMedicalRecords");
        const makeMedicalRecordCard = (record) => {
            const card = document.createElement("article"); card.className = "medical-record-card";
            const top = document.createElement("div"); top.className = "medical-record-top";
            const title = document.createElement("strong"); title.textContent = `${record.petName}: ${record.title}`;
            const type = document.createElement("span"); type.className = "mini-pill green"; type.textContent = record.type;
            top.append(title, type);
            const meta = document.createElement("p"); meta.className = "medical-record-meta";
            meta.textContent = `${new Date(`${record.date}T00:00:00`).toLocaleDateString()} · Dr. ${record.vetName}`;
            const notes = document.createElement("p"); notes.className = "medical-record-notes"; notes.textContent = record.notes;
            card.append(top, meta, notes);
            if (record.prescription) { const plan = document.createElement("p"); plan.className = "medical-record-prescription"; plan.textContent = `Care plan: ${record.prescription}`; card.appendChild(plan); }
            return card;
        };
        const renderParentMedicalRecords = () => {
            if (!parentMedicalRecords) return;
            const petIds = new Set(readLocalArray("woofyPets").filter((pet) => pet.ownerEmail === currentUser.email).map((pet) => pet.id));
            const records = readMedicalRecords().filter((record) => record.parentEmail === currentUser.email || petIds.has(record.petId));
            parentMedicalRecords.replaceChildren();
            if (!records.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No medical records yet. Your vet can add the first one after a visit."; parentMedicalRecords.appendChild(empty); return; }
            records.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((record) => parentMedicalRecords.appendChild(makeMedicalRecordCard(record)));
        };
        const renderVetMedicalRecords = () => {
            if (!vetMedicalRecords) return;
            const records = readMedicalRecords().filter((record) => record.vetEmail === currentUser.email);
            vetMedicalRecords.replaceChildren();
            if (!records.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No records have been added yet."; vetMedicalRecords.appendChild(empty); return; }
            records.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((record) => vetMedicalRecords.appendChild(makeMedicalRecordCard(record)));
        };
        let activePetDashboardPet = null;
        const openPetDashboard = (pet) => {
            if (!pet) return;
            activePetDashboardPet = pet;
            // Keep woofy AI's context in sync with the pet whose dashboard is open.
            // This is intentionally set before the chat is opened, so the selector is
            // already correct whenever the pet parent launches woofy.
            if (!isVeterinarian) {
                refreshWoofyPetContextOptions(pet.id);
                const contextSelect = document.querySelector("#woofyPetContext");
                if (contextSelect) {
                    contextSelect.value = pet.id;
                    contextSelect.dispatchEvent(new Event("change", { bubbles: true }));
                }
            }
            const parentPanels = document.querySelector("#petParentPanels");
            const vetPanels = document.querySelector("#vetPanels");
            const view = document.querySelector("#petDashboardView");
            const profilePanel = document.querySelector("#profilePanel");
            if (parentPanels) parentPanels.hidden = true;
            if (vetPanels) vetPanels.hidden = true;
            if (profilePanel) profilePanel.hidden = true;
            if (view) view.hidden = false;
            const hero = document.querySelector("#petDashboardHero");
            hero?.replaceChildren();
            const avatar = pet.photo ? document.createElement("img") : document.createElement("span");
            if (pet.photo) { avatar.src = pet.photo; avatar.alt = `${pet.name}'s profile`; avatar.className = "pet-dashboard-avatar"; }
            else { avatar.className = "pet-dashboard-avatar pet-emoji"; avatar.textContent = petEmoji(pet.type); }
            const intro = document.createElement("div");
            const title = document.createElement("h1"); title.textContent = `${pet.name}'s little world`;
            const subtitle = document.createElement("p"); subtitle.textContent = [pet.type, pet.breed, pet.age !== "" && pet.age != null ? `${pet.age} years old` : ""].filter(Boolean).join(" · ") || "A very good furry friend";
            intro.append(title, subtitle); hero?.append(avatar, intro);
            const profile = document.querySelector("#petDashboardProfile"); profile?.replaceChildren();
            const profileRows = [["Pet type", pet.type], ["Breed", pet.breed], ["Age", pet.age !== "" && pet.age != null ? `${pet.age} years` : "Not added"], ["Weight", pet.weight ? `${pet.weight} kg` : "Not added"], ["About", pet.notes || "No notes yet"]];
            profileRows.forEach(([label, value]) => { const row = document.createElement("p"); row.className = "pet-profile-detail"; const strong = document.createElement("strong"); strong.textContent = `${label}: `; row.append(strong, document.createTextNode(value || "Not added")); profile?.appendChild(row); });
            const appointments = readLocalArray("woofyAppointments").filter((item) => {
                const samePetId = item.petId != null && String(item.petId) === String(pet.id);
                const legacyPetMatch = item.petName && item.petName.trim().toLowerCase() === String(pet.name || "").trim().toLowerCase()
                    && (item.parentEmail === currentUser.email || (!item.parentEmail && pet.ownerEmail === currentUser.email));
                return (item.parentEmail === currentUser.email || !item.parentEmail) && (samePetId || legacyPetMatch);
            });
            const appointmentBox = document.querySelector("#petDashboardAppointments"); appointmentBox?.replaceChildren();
            if (!appointments.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No appointments saved for this pet yet."; appointmentBox?.appendChild(empty); }
            else appointments.sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime)).forEach((item) => appointmentBox?.appendChild(makeAppointmentCard(item, false, true)));
            const vaccinations = readLocalArray("woofyVaccinations").filter((item) => item.petId === pet.id);
            const vaccineBox = document.querySelector("#petDashboardVaccinations"); vaccineBox?.replaceChildren();
            if (!vaccinations.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No vaccination records saved for this pet yet."; vaccineBox?.appendChild(empty); }
            else vaccinations.forEach((item) => vaccineBox?.appendChild(makeVaccinationCard(item)));
            const records = readMedicalRecords().filter((item) => item.petId === pet.id);
            const recordsBox = document.querySelector("#petDashboardRecords"); recordsBox?.replaceChildren();
            if (!records.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No medical records saved for this pet yet."; recordsBox?.appendChild(empty); }
            else records.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach((item) => recordsBox?.appendChild(makeMedicalRecordCard(item)));
            view?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        document.querySelector("#backToPets")?.addEventListener("click", () => {
            document.querySelector("#petDashboardView").hidden = true;
            document.querySelector(isVeterinarian ? "#vetPanels" : "#petParentPanels").hidden = false;
            const profilePanel = document.querySelector("#profilePanel");
            if (profilePanel) profilePanel.hidden = false;
            activePetDashboardPet = null;
        });
        document.querySelector("#askWoofyAboutPet")?.addEventListener("click", () => {
            if (!isVeterinarian) document.querySelector("#woofyFab")?.click();
        });
        const getVetPatients = (confirmedOnly = false) => {
            const appointments = readLocalArray("woofyAppointments").filter((item) => item.vetEmail === currentUser.email && (!confirmedOnly || item.status === "accepted"));
            const allPets = readLocalArray("woofyPets"); const found = new Map();
            appointments.forEach((appointment) => {
                const pet = allPets.find((item) => item.id === appointment.petId) || allPets.find((item) => item.name === appointment.petName && item.ownerEmail === appointment.parentEmail);
                if (pet) found.set(pet.id, { ...pet, parentName: appointment.parentName, parentEmail: appointment.parentEmail });
                else { const key = appointment.petId; if (!found.has(key)) found.set(key, { id: key, name: appointment.petName, type: "Pet", breed: "", ownerEmail: appointment.parentEmail, parentName: appointment.parentName }); }
            });
            return [...found.values()];
        };
        const renderVetPatients = () => {
            if (!vetPatientList) return;
            vetPatientList.replaceChildren(); const patients = getVetPatients();
            if (!patients.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "Patient profiles will appear here when pet parents book with you."; vetPatientList.appendChild(empty); return; }
            patients.forEach((pet) => {
                const row = document.createElement("button"); row.type = "button"; row.className = "patient-row patient-row-button";
                row.addEventListener("click", () => openPetDashboard(pet));
                const avatar = document.createElement("span"); avatar.className = "pet-emoji"; avatar.textContent = petEmoji(pet.type);
                const info = document.createElement("div"); const name = document.createElement("strong"); name.textContent = pet.name;
                const meta = document.createElement("small"); meta.textContent = `${pet.type}${pet.breed ? ` · ${pet.breed}` : ""} · Parent: ${pet.parentName || "Pet parent"}`;
                info.append(name, meta); row.append(avatar, info); vetPatientList.appendChild(row);
            });
        };
        if (!isVeterinarian) renderParentMedicalRecords();
        if (isVeterinarian && recordPetSelect && medicalRecordForm) {
            const patients = getVetPatients(true);
            patients.forEach((pet) => { const option = new Option(`${pet.name} · ${pet.parentName || "Pet parent"}`, pet.id); option.dataset.petName = pet.name; recordPetSelect.appendChild(option); });
            if (!patients.length) { const hint = document.querySelector("#recordFormHint"); if (hint) hint.textContent = "A confirmed appointment is needed before you can add a medical record for a pet."; }
            medicalRecordForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const patient = patients.find((pet) => String(pet.id) === String(recordPetSelect.value));
                const title = document.querySelector("#recordTitle").value.trim();
                const notes = document.querySelector("#recordNotes").value.trim();
                const date = document.querySelector("#recordDate").value;
                const type = document.querySelector("#recordType").value;
                if (!patient || !title || !notes || !date || !type) { showMessage("Please complete all required medical record fields.", "error"); return; }
                const prescription = document.querySelector("#recordPrescription").value.trim();
                try {
                    const saved = await apiRequest("/api/medical-records", { method: "POST", body: JSON.stringify({
                        pet_id: Number(patient.id), title, record_type: type,
                        record_date: new Date(`${date}T12:00:00`).toISOString(), notes, prescription
                    }) });
                    const records = readMedicalRecords();
                    records.push({ id: saved.id, petId: Number(patient.id), petName: patient.name, parentEmail: patient.ownerEmail,
                        vetEmail: currentUser.email, vetName: currentUser.name, type, title, date, notes, prescription });
                    saveLocalArray("woofyMedicalRecords", records); medicalRecordForm.reset();
                    document.querySelector("#recordDate").value = new Date().toISOString().slice(0, 10);
                    renderVetMedicalRecords(); showMessage(`Medical record saved for ${patient.name}. 🩺`);
                } catch (error) { showApiError(error); }
            });
            document.querySelector("#recordDate").value = new Date().toISOString().slice(0, 10);
            renderVetMedicalRecords(); renderVetPatients();
        }


        /* VACCINATION TRACKER — FRONTEND DEMO */
        const parentVaccinationList = document.querySelector("#parentVaccinationList");
        const parentVaccinationSummary = document.querySelector("#parentVaccinationSummary");
        const vetVaccinationList = document.querySelector("#vetVaccinationList");
        const vaccinationForm = document.querySelector("#vaccinationForm");
        const vaccinationPetSelect = document.querySelector("#vaccinationPet");
        const saveVaccinationButton = document.querySelector("#saveVaccinationButton");
        const cancelVaccinationEdit = document.querySelector("#cancelVaccinationEdit");
        const readVaccinations = () => readLocalArray("woofyVaccinations");
        let editingVaccinationId = null;
        const todayISO = () => new Date().toISOString().slice(0, 10);
        const formatHealthDate = (value) => {
            if (!value) return "Not set";
            const date = new Date(`${value}T00:00:00`);
            return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
        };
        const vaccinationState = (record) => {
            if (!record.nextDueDate) return { label: "No due date", className: "neutral" };
            const today = todayISO();
            if (record.nextDueDate < today) return { label: "Overdue", className: "overdue" };
            const days = Math.ceil((new Date(`${record.nextDueDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000);
            if (days <= 30) return { label: days === 0 ? "Due today" : `Due in ${days} days`, className: "due-soon" };
            return { label: "Up to date", className: "up-to-date" };
        };
        const makeVaccinationCard = (record, allowEdit = false) => {
            const card = document.createElement("article"); card.className = "vaccination-card";
            const top = document.createElement("div"); top.className = "vaccination-card-top";
            const title = document.createElement("strong"); title.textContent = `${record.petName} · ${record.vaccineName}`;
            const state = vaccinationState(record); const badge = document.createElement("span"); badge.className = `vaccine-status ${state.className}`; badge.textContent = state.label;
            top.append(title, badge);
            const dates = document.createElement("p"); dates.className = "vaccination-meta"; dates.textContent = `Given: ${formatHealthDate(record.dateAdministered)} · Next due: ${formatHealthDate(record.nextDueDate)}`;
            card.append(top, dates);
            if (record.batchNumber) { const batch = document.createElement("p"); batch.className = "vaccination-notes"; batch.textContent = `Batch / lot: ${record.batchNumber}`; card.appendChild(batch); }
            if (record.notes) { const notes = document.createElement("p"); notes.className = "vaccination-notes"; notes.textContent = record.notes; card.appendChild(notes); }
            if (record.vetName) { const vet = document.createElement("p"); vet.className = "vaccination-meta"; vet.textContent = `Recorded by Dr. ${record.vetName}`; card.appendChild(vet); }
            if (allowEdit) {
                const actions = document.createElement("div"); actions.className = "vaccination-actions";
                const edit = document.createElement("button"); edit.type = "button"; edit.className = "btn btn-light pet-action"; edit.textContent = "Edit";
                edit.addEventListener("click", () => {
                    editingVaccinationId = record.id;
                    vaccinationPetSelect.value = record.petId;
                    document.querySelector("#vaccineName").value = record.vaccineName || "";
                    document.querySelector("#vaccineDate").value = record.dateAdministered || "";
                    document.querySelector("#vaccineDueDate").value = record.nextDueDate || "";
                    document.querySelector("#vaccineBatch").value = record.batchNumber || "";
                    document.querySelector("#vaccineNotes").value = record.notes || "";
                    saveVaccinationButton.textContent = "Save changes"; cancelVaccinationEdit.hidden = false;
                    vaccinationForm.scrollIntoView({ behavior: "smooth", block: "center" });
                });
                const remove = document.createElement("button"); remove.type = "button"; remove.className = "btn btn-light pet-action"; remove.textContent = "Delete";
                remove.addEventListener("click", async () => {
                    if (!window.confirm(`Delete the ${record.vaccineName} record for ${record.petName}?`)) return;
                    try {
                        await apiRequest(`/api/vaccinations/${record.id}`, { method: "DELETE" });
                        saveLocalArray("woofyVaccinations", readVaccinations().filter((item) => item.id !== record.id));
                        renderVetVaccinations(); showMessage("Vaccination record deleted.");
                    } catch (error) { showApiError(error); }
                });
                actions.append(edit, remove); card.appendChild(actions);
            }
            return card;
        };
        const renderParentVaccinations = () => {
            if (!parentVaccinationList) return;
            const petIds = new Set(readLocalArray("woofyPets").filter((pet) => pet.ownerEmail === currentUser.email).map((pet) => pet.id));
            const records = readVaccinations().filter((record) => record.parentEmail === currentUser.email || petIds.has(record.petId));
            parentVaccinationList.replaceChildren();
            if (!records.length) {
                const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "Your vaccination records will appear here when your vet adds them."; parentVaccinationList.appendChild(empty);
            } else {
                records.sort((a, b) => (a.nextDueDate || "9999").localeCompare(b.nextDueDate || "9999")).forEach((record) => parentVaccinationList.appendChild(makeVaccinationCard(record)));
            }
            if (parentVaccinationSummary) {
                const overdue = records.filter((record) => vaccinationState(record).className === "overdue").length;
                const soon = records.filter((record) => vaccinationState(record).className === "due-soon").length;
                parentVaccinationSummary.replaceChildren();
                [[records.length, "records"], [soon, "due soon"], [overdue, "overdue"]].forEach(([value, label]) => {
                    const item = document.createElement("div"); item.className = "vaccination-stat";
                    const number = document.createElement("strong"); number.textContent = value;
                    const caption = document.createElement("span"); caption.textContent = label;
                    item.append(number, caption); parentVaccinationSummary.appendChild(item);
                });
            }
        };
        const renderVetVaccinations = () => {
            if (!vetVaccinationList) return;
            const records = readVaccinations().filter((record) => record.vetEmail === currentUser.email);
            vetVaccinationList.replaceChildren();
            if (!records.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No vaccination records have been added yet."; vetVaccinationList.appendChild(empty); return; }
            records.sort((a, b) => new Date(b.dateAdministered) - new Date(a.dateAdministered)).forEach((record) => vetVaccinationList.appendChild(makeVaccinationCard(record, true)));
        };
        if (!isVeterinarian) renderParentVaccinations();
        if (isVeterinarian && vaccinationForm && vaccinationPetSelect) {
            const vaccinationPatients = getVetPatients(true);
            vaccinationPatients.forEach((pet) => vaccinationPetSelect.appendChild(new Option(`${pet.name} · ${pet.parentName || "Pet parent"}`, pet.id)));
            if (!vaccinationPatients.length) {
                const hint = document.querySelector("#vaccinationFormHint");
                if (hint) hint.textContent = "A confirmed appointment is needed before you can add a vaccination record for a pet.";
            }
            const resetVaccinationForm = () => {
                editingVaccinationId = null; vaccinationForm.reset();
                saveVaccinationButton.textContent = "Save vaccination 🐾"; cancelVaccinationEdit.hidden = true;
            };
            cancelVaccinationEdit.addEventListener("click", resetVaccinationForm);
            vaccinationForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const patient = vaccinationPatients.find((pet) => String(pet.id) === String(vaccinationPetSelect.value));
                const vaccineName = document.querySelector("#vaccineName").value.trim();
                const dateAdministered = document.querySelector("#vaccineDate").value;
                const nextDueDate = document.querySelector("#vaccineDueDate").value;
                if (!patient || !vaccineName || !dateAdministered) { showMessage("Choose a patient and complete the vaccine name and date.", "error"); return; }
                if (dateAdministered > todayISO()) { showMessage("The administered date cannot be in the future.", "error"); return; }
                if (nextDueDate && nextDueDate < dateAdministered) { showMessage("The next due date cannot be before the administered date.", "error"); return; }
                const records = readVaccinations();
                const existing = editingVaccinationId ? records.find((item) => item.id === editingVaccinationId && item.vetEmail === currentUser.email) : null;
                const apiPayload = { pet_id: Number(patient.id), vaccine_name: vaccineName,
                    date_administered: new Date(`${dateAdministered}T12:00:00`).toISOString(),
                    next_due_date: nextDueDate ? new Date(`${nextDueDate}T12:00:00`).toISOString() : null,
                    notes: [document.querySelector("#vaccineBatch").value.trim(), document.querySelector("#vaccineNotes").value.trim()].filter(Boolean).join(" · ") || null };
                try {
                    const saved = await apiRequest(existing ? `/api/vaccinations/${existing.id}` : "/api/vaccinations", {
                        method: existing ? "PUT" : "POST", body: JSON.stringify(apiPayload)
                    });
                    const data = { id: existing?.id || saved.id, petId: Number(patient.id), petName: patient.name, parentEmail: patient.ownerEmail,
                        vetEmail: currentUser.email, vetName: currentUser.name, vaccineName, dateAdministered, nextDueDate,
                        batchNumber: document.querySelector("#vaccineBatch").value.trim(), notes: document.querySelector("#vaccineNotes").value.trim(), updatedAt: new Date().toISOString() };
                    if (existing) records[records.findIndex((item) => item.id === existing.id)] = { ...existing, ...data };
                    else records.push({ ...data, createdAt: new Date().toISOString() });
                    saveLocalArray("woofyVaccinations", records);
                    resetVaccinationForm(); renderVetVaccinations(); showMessage(existing ? "Vaccination record updated! 💉" : `Vaccination saved for ${patient.name}! 💉`);
                } catch (error) { showApiError(error); }
            });
            document.querySelector("#vaccineDate").max = todayISO();
            renderVetVaccinations();
        }

        /* CONTACT VET — LOCAL PREVIEW UNTIL POSTGRESQL IS CONNECTED */
        const parentMessageForm = document.querySelector("#parentMessageForm");
        const parentMessageThreads = document.querySelector("#parentMessageThreads");
        const vetMessageThreads = document.querySelector("#vetMessageThreads");
        const messagePetSelect = document.querySelector("#messagePet");
        const messageVetSelect = document.querySelector("#messageVet");
        const readMessageThreads = () => readLocalArray("woofyConversations");
        const saveMessageThreads = (items) => saveLocalArray("woofyConversations", items);
        const formatMessageTime = (value) => {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
        };
        refreshContactPetOptions = () => {
            if (!messagePetSelect) return;
            const previous = messagePetSelect.value;
            messagePetSelect.replaceChildren(new Option("Choose your pet", ""));
            readLocalArray("woofyPets").filter((pet) => pet.ownerEmail === currentUser.email).forEach((pet) => {
                messagePetSelect.appendChild(new Option(pet.name, pet.id));
            });
            if ([...messagePetSelect.options].some((option) => option.value === previous)) messagePetSelect.value = previous;
        };
        if (messageVetSelect) {
            readLocalArray("woofyUsers").filter((user) => user.role === "veterinarian" && user.status !== "suspended" && (user.vetApproval || "approved") === "approved").forEach((vet) => {
                messageVetSelect.appendChild(new Option(vet.name, vet.email));
            });
        }
        refreshContactPetOptions();
        const readUserProfile = (email) => {
            try { return JSON.parse(localStorage.getItem(`woofyProfile:${email}`) || "{}"); }
            catch { return {}; }
        };
        const makeAccountAvatar = (email, name, className = "account-avatar") => {
            const profile = readUserProfile(email);
            if (profile.photo) {
                const image = document.createElement("img");
                image.className = className;
                image.src = profile.photo;
                image.alt = `${name || "User"} profile picture`;
                return image;
            }
            const fallback = document.createElement("span");
            fallback.className = `${className} account-avatar-fallback`;
            fallback.textContent = (name || "W").trim().charAt(0).toUpperCase();
            fallback.setAttribute("aria-label", `${name || "User"} profile placeholder`);
            return fallback;
        };
        const makeConversationCard = (conversation, viewerRole) => {
            const card = document.createElement("article");
            card.className = "message-thread-card";
            const heading = document.createElement("div");
            heading.className = "message-thread-heading";
            const identity = document.createElement("div"); identity.className = "message-thread-identity";
            const counterpartEmail = viewerRole === "vet" ? conversation.parentEmail : conversation.vetEmail;
            const counterpartName = viewerRole === "vet" ? conversation.parentName : conversation.vetName;
            const avatar = makeAccountAvatar(counterpartEmail, counterpartName, "account-avatar message-account-avatar");
            const identityText = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = `${conversation.petName || "Pet"} · ${counterpartName || "woofy user"}`;
            const meta = document.createElement("small");
            meta.textContent = `Last activity: ${formatMessageTime(conversation.updatedAt || conversation.createdAt)}`;
            identityText.append(title); identity.append(avatar, identityText); heading.append(identity, meta);
            const transcript = document.createElement("div");
            transcript.className = "message-transcript";
            (conversation.messages || []).forEach((message) => {
                const bubble = document.createElement("div");
                bubble.className = `message-bubble ${message.senderEmail === currentUser.email ? "mine" : "theirs"}`;
                const author = document.createElement("strong"); author.textContent = message.senderName || "woofy user";
                const body = document.createElement("p"); body.textContent = message.content;
                const time = document.createElement("small"); time.textContent = formatMessageTime(message.sentAt);
                bubble.append(author, body, time); transcript.appendChild(bubble);
            });
            card.append(heading, transcript);
            const replyForm = document.createElement("form");
            replyForm.className = "thread-reply-form";
            const reply = document.createElement("textarea"); reply.rows = 2; reply.maxLength = 1200; reply.required = true; reply.placeholder = "Write a reply…";
            const send = document.createElement("button"); send.type = "submit"; send.className = "btn btn-light"; send.textContent = "Reply";
            replyForm.append(reply, send);
            replyForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const content = reply.value.trim();
                if (!content) return;
                try {
                    await apiRequest(`/api/conversations/${conversation.id}/messages`, { method: "POST", body: JSON.stringify({ body: content }) });
                    const all = readMessageThreads();
                    const target = all.find((item) => item.id === conversation.id);
                    if (!target) return;
                    target.messages = Array.isArray(target.messages) ? target.messages : [];
                    target.messages.push({ senderEmail: currentUser.email, senderName: currentUser.name, content, sentAt: new Date().toISOString() });
                    target.updatedAt = new Date().toISOString();
                    saveMessageThreads(all);
                    renderMessageInboxes();
                    showMessage("Your reply has been sent.");
                } catch (error) { showApiError(error); }
            });
            card.appendChild(replyForm);
            return card;
        };
        const renderMessageInboxes = () => {
            const threads = readMessageThreads();
            if (parentMessageThreads) {
                const mine = threads.filter((thread) => thread.parentEmail === currentUser.email).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
                parentMessageThreads.replaceChildren();
                if (!mine.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No conversations yet. Send your vet a message above."; parentMessageThreads.appendChild(empty); }
                else mine.forEach((thread) => parentMessageThreads.appendChild(makeConversationCard(thread, "parent")));
            }
            if (vetMessageThreads) {
                const mine = threads.filter((thread) => thread.vetEmail === currentUser.email).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
                vetMessageThreads.replaceChildren();
                if (!mine.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "Your message inbox is empty for now."; vetMessageThreads.appendChild(empty); }
                else mine.forEach((thread) => vetMessageThreads.appendChild(makeConversationCard(thread, "vet")));
            }
        };
        parentMessageForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const pet = readLocalArray("woofyPets").find((item) => String(item.id) === String(messagePetSelect?.value) && item.ownerEmail === currentUser.email);
            const vet = readLocalArray("woofyUsers").find((item) => item.email === messageVetSelect?.value && item.role === "veterinarian" && item.status !== "suspended" && (item.vetApproval || "approved") === "approved");
            const content = document.querySelector("#parentMessageText")?.value.trim();
            if (!pet || !vet || !content) { showMessage("Choose your pet and a veterinarian, then write a message.", "error"); return; }
            try {
                const all = readMessageThreads();
                let conversation = all.find((item) => item.parentEmail === currentUser.email && item.vetEmail === vet.email && String(item.petId) === String(pet.id));
                if (!conversation) {
                    const created = await apiRequest(`/api/conversations?pet_id=${Number(pet.id)}&vet_id=${Number(vet.id)}`, { method: "POST" });
                    conversation = { id: created.id, parentEmail: currentUser.email, parentName: currentUser.name, vetEmail: vet.email, vetName: vet.name, petId: pet.id, petName: pet.name, messages: [], createdAt: created.created_at };
                    all.push(conversation);
                }
                await apiRequest(`/api/conversations/${conversation.id}/messages`, { method: "POST", body: JSON.stringify({ body: content }) });
                conversation.messages.push({ senderEmail: currentUser.email, senderName: currentUser.name, content, sentAt: new Date().toISOString() });
                conversation.updatedAt = new Date().toISOString();
                saveMessageThreads(all);
                parentMessageForm.reset();
                renderMessageInboxes();
                showMessage("Message sent to your veterinarian.");
            } catch (error) { showApiError(error); }
        });
        renderMessageInboxes();

        /* PROFILE DETAILS + INDIA EMERGENCY CONTACTS */
        const profileDetailsForm = document.querySelector("#profileDetailsForm");
        const profileKey = `woofyProfile:${currentUser.email}`;
        const savedProfile = readUserProfile(currentUser.email);
        const profilePhotoInput = document.querySelector("#profilePhoto");
        const profilePhotoPreview = document.querySelector("#profilePhotoPreview");
        const dashboardProfileAvatar = document.querySelector("#dashboardProfileAvatar");
        let pendingProfilePhoto = savedProfile.photo || "";
        const refreshProfileAvatars = () => {
            if (profilePhotoPreview) {
                profilePhotoPreview.hidden = !pendingProfilePhoto;
                if (pendingProfilePhoto) profilePhotoPreview.src = pendingProfilePhoto;
            }
            if (dashboardProfileAvatar) {
                dashboardProfileAvatar.hidden = !savedProfile.photo;
                if (savedProfile.photo) dashboardProfileAvatar.src = savedProfile.photo;
            }
            renderEmergencyVets();
            renderMessageInboxes();
        };
        if (profilePhotoInput) profilePhotoInput.addEventListener("change", () => {
            const file = profilePhotoInput.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) { showMessage("Please choose an image file.", "error"); return; }
            if (file.size > 8 * 1024 * 1024) { showMessage("Please choose an image smaller than 8 MB.", "error"); profilePhotoInput.value = ""; return; }
            const reader = new FileReader();
            reader.onload = () => {
                const image = new Image();
                image.onload = () => {
                    const canvas = document.createElement("canvas");
                    const scale = Math.min(1, 320 / Math.max(image.width, image.height));
                    canvas.width = Math.max(1, Math.round(image.width * scale));
                    canvas.height = Math.max(1, Math.round(image.height * scale));
                    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                    pendingProfilePhoto = canvas.toDataURL("image/jpeg", 0.78);
                    if (profilePhotoPreview) { profilePhotoPreview.src = pendingProfilePhoto; profilePhotoPreview.hidden = false; }
                };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
        if (pendingProfilePhoto && profilePhotoPreview) { profilePhotoPreview.src = pendingProfilePhoto; profilePhotoPreview.hidden = false; }
        if (savedProfile.photo && dashboardProfileAvatar) { dashboardProfileAvatar.src = savedProfile.photo; dashboardProfileAvatar.hidden = false; }
        ["Phone", "City", "District", "State", "Pincode", "Address"].forEach((field) => {
            const input = document.querySelector(`#profile${field}`);
            const key = field.toLowerCase();
            if (input) input.value = savedProfile[key] || "";
        });
        profileDetailsForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const details = {
                phone: document.querySelector("#profilePhone").value.trim(),
                city: document.querySelector("#profileCity").value.trim(),
                district: document.querySelector("#profileDistrict").value.trim(),
                state: document.querySelector("#profileState").value.trim(),
                pincode: document.querySelector("#profilePincode").value.trim(),
                address: document.querySelector("#profileAddress").value.trim(),
                photo: pendingProfilePhoto
            };
            if (details.pincode && !/^\d{6}$/.test(details.pincode)) { showMessage("Please enter a valid 6-digit Indian PIN code.", "error"); return; }
            try {
                const location = [details.city, details.district, details.state, details.pincode].filter(Boolean).join(", ");
                await apiRequest("/api/profile", { method: "PUT", body: JSON.stringify({
                    phone: details.phone || null, location: location || null, photo_data: details.photo || null,
                    clinic_name: savedProfile.clinicName || null, clinic_address: details.address || null
                }) });
            } catch (error) { showApiError(error); return; }
            localStorage.setItem(profileKey, JSON.stringify(details));
            Object.assign(savedProfile, details);
            if (dashboardProfileAvatar) { dashboardProfileAvatar.src = details.photo || ""; dashboardProfileAvatar.hidden = !details.photo; }
            const status = document.querySelector("#profileDetailsStatus");
            if (status) status.textContent = "Your details have been saved.";
            renderEmergencyVets();
            showMessage("Your contact and location details were saved.");
        });
        const renderEmergencyVets = () => {
            const list = document.querySelector("#emergencyVetList");
            if (!list) return;
            list.replaceChildren();
            const vets = readLocalArray("woofyUsers").filter((user) => user.role === "veterinarian" && user.status !== "suspended" && (user.vetApproval || "approved") === "approved");
            if (!vets.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No approved veterinarians are available in the local directory yet."; list.appendChild(empty); return; }
            vets.forEach((vet) => {
                const profile = readUserProfile(vet.email);
                const card = document.createElement("article"); card.className = "emergency-vet-card";
                const identity = document.createElement("div"); identity.className = "emergency-vet-identity";
                const avatar = makeAccountAvatar(vet.email, vet.name, "account-avatar emergency-vet-avatar");
                const details = document.createElement("div"); details.className = "emergency-vet-details";
                const name = document.createElement("strong"); name.textContent = vet.name;
                const location = document.createElement("p"); location.textContent = [profile.city, profile.district, profile.state, profile.pincode].filter(Boolean).join(", ") || "Location not added";
                details.append(name, location); identity.append(avatar, details); card.append(identity);
                if (profile.phone) { const call = document.createElement("a"); call.className = "btn btn-light"; call.href = `tel:${profile.phone.replace(/[^+\d]/g, "")}`; call.textContent = `Call ${vet.name}`; card.appendChild(call); }
                else { const noPhone = document.createElement("small"); noPhone.textContent = "Phone number not provided"; card.appendChild(noPhone); }
                list.appendChild(card);
            });
        };
        renderEmergencyVets();
        document.querySelector("#shareEmergencyLocation")?.addEventListener("click", () => {
            const status = document.querySelector("#emergencyLocationStatus");
            if (!navigator.geolocation) { if (status) status.textContent = "Location sharing is not supported by this browser. You can enter your location in My details."; return; }
            if (status) status.textContent = "Waiting for your permission to access location…";
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                if (status) {
                    status.replaceChildren(document.createTextNode("Location ready: "));
                    const link = document.createElement("a"); link.href = mapUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Open my location in Maps";
                    status.appendChild(link);
                    const copy = document.createElement("button"); copy.type = "button"; copy.className = "btn btn-light"; copy.textContent = "Copy location link";
                    copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(mapUrl); copy.textContent = "Copied!"; } catch { status.append(" Please copy the Maps link from your browser address bar."); } });
                    status.appendChild(copy);
                }
            }, (error) => {
                if (status) status.textContent = error.code === error.PERMISSION_DENIED ? "Location permission was denied. You can enter your city or address in My details instead." : "We couldn't get your location just now. Please enter your location in My details.";
            }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
        });

                /* WOOFY AI — FLOATING API-POWERED COMPANION */
        const woofyFab = document.querySelector("#woofyFab");
        const woofyWidget = document.querySelector("#woofyWidget");
        const woofyClose = document.querySelector("#woofyClose");
        const woofyClearChat = document.querySelector("#woofyClearChat");
        const woofyWidgetMessages = document.querySelector("#woofyWidgetMessages");
        const woofyWidgetForm = document.querySelector("#woofyWidgetForm");
        const woofyWidgetQuestion = document.querySelector("#woofyWidgetQuestion");
        const woofyPetContextSelect = document.querySelector("#woofyPetContext");
        const woofyApiStatus = document.querySelector("#woofyApiStatus");
        // Woofy AI is a pet-parent feature in the current dashboard workflow.
        // Keep both the launcher and the pet-dashboard shortcut out of the vet UI.
        if (isVeterinarian || isAdmin) {
            if (woofyFab) woofyFab.hidden = true;
            if (woofyWidget) woofyWidget.hidden = true;
            const petChatShortcut = document.querySelector("#askWoofyAboutPet");
            if (petChatShortcut) petChatShortcut.hidden = true;
        }
        const WOOFY_AI_API_URL = "http://127.0.0.1:8000/api/ai/chat";
        let woofyHistory = [];
        let activeWoofyConversationId = null;
        let activeWoofyThreadKey = "";
        const getWoofyThreadKey = () => `${currentUser.email}::${woofyPetContextSelect?.value || "general"}`;
        const readWoofyThreads = () => {
            try {
                const value = JSON.parse(localStorage.getItem("woofyChatThreads") || "{}");
                return value && typeof value === "object" && !Array.isArray(value) ? value : {};
            } catch { return {}; }
        };
        const saveActiveWoofyThread = () => {
            if (!activeWoofyThreadKey) return;
            const threads = readWoofyThreads();
            threads[activeWoofyThreadKey] = woofyHistory.slice(-100);
            localStorage.setItem("woofyChatThreads", JSON.stringify(threads));
        };
        const renderActiveWoofyThread = () => {
            if (!woofyWidgetMessages) return;
            woofyWidgetMessages.replaceChildren();
            if (!woofyHistory.length) {
                const selectedId = woofyPetContextSelect?.value || "";
                let greeting = "I'm all ears (and paws)! Ask me anything about everyday pet care. 💛";
                if (selectedId === "all") greeting = "I'm ready to help with all your pets! What would you like to know? 🐾";
                else if (selectedId) {
                    const pet = readLocalArray("woofyPets").find((item) => String(item.id) === String(selectedId) && item.ownerEmail === currentUser.email);
                    greeting = `I'm ready to chat about ${pet?.name || "your pet"}! What would you like to know? 🐾`;
                }
                addWoofyWidgetMessage(greeting, "bot");
                return;
            }
            woofyHistory.forEach((message) => addWoofyWidgetMessage(message.content, message.role === "assistant" ? "bot" : "user"));
        };
        const loadWoofyThreadForCurrentContext = async () => {
            activeWoofyThreadKey = getWoofyThreadKey();
            activeWoofyConversationId = null;
            woofyHistory = [];
            renderActiveWoofyThread();
            try {
                const selected = woofyPetContextSelect?.value || "";
                const wantedPetId = selected && selected !== "all" ? Number(selected) : null;
                const conversations = await apiRequest("/api/ai/conversations");
                const conversation = conversations.find((item) => item.pet_id === wantedPetId) ||
                    (!wantedPetId ? conversations.find((item) => item.pet_id == null) : null);
                if (conversation) {
                    activeWoofyConversationId = conversation.id;
                    const messages = await apiRequest(`/api/ai/conversations/${conversation.id}/messages`);
                    woofyHistory = messages.map((item) => ({ role: item.role, content: item.content }));
                }
            } catch (error) {
                console.warn("Could not restore saved Woofy AI conversation:", error);
                if (woofyApiStatus) woofyApiStatus.textContent = "Chat history unavailable";
            }
            renderActiveWoofyThread();
        };

        const setWoofyOpen = (open) => {
            if (!woofyWidget || !woofyFab) return;
            woofyWidget.hidden = !open;
            woofyWidget.setAttribute("aria-hidden", String(!open));
            woofyFab.setAttribute("aria-expanded", String(open));
            woofyFab.classList.toggle("is-open", open);
            if (open) setTimeout(() => woofyWidgetQuestion?.focus(), 80);
        };
        
const appendWoofyInlineText = (element, text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    parts.forEach((part) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            const strong = document.createElement("strong");
            strong.textContent = part.slice(2, -2);
            element.appendChild(strong);
        } else {
            element.appendChild(document.createTextNode(part));
        }
    });
};

const addWoofyWidgetMessage = (message, sender, extraClass = "") => {
    if (!woofyWidgetMessages) return;

    const row = document.createElement("div");
    row.className = `woofy-widget-message ${sender} ${extraClass}`.trim();

    if (sender === "bot") {
        const avatar = document.createElement("span");
        avatar.className = "message-paw";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = "🐾";
        row.appendChild(avatar);
    }

    const bubble = document.createElement("p");
    const lines = String(message).split(/\r?\n/);

    lines.forEach((line, index) => {
        const cleanedLine = line.trim();

        if (cleanedLine) {
            const bulletMatch = cleanedLine.match(/^[-*•]\s+(.*)/);

            if (bulletMatch) {
                bubble.appendChild(document.createTextNode("• "));
                appendWoofyInlineText(bubble, bulletMatch[1]);
            } else {
                appendWoofyInlineText(bubble, cleanedLine);
            }
        }

        if (index < lines.length - 1) {
            bubble.appendChild(document.createElement("br"));
        }
    });

    row.appendChild(bubble);
    woofyWidgetMessages.appendChild(row);

    woofyWidgetMessages.scrollTop = woofyWidgetMessages.scrollHeight;

    return row;
};

        const getWoofyPetContext = () => {
            const read = (key) => {
                try {
                    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
                    return Array.isArray(parsed) ? parsed : [];
                } catch { return []; }
            };
            const email = currentUser?.email;
            const selectedPetId = woofyPetContextSelect?.value || "";
            const availablePets = read("woofyPets").filter((pet) => isVeterinarian ? getVetPatients().some((patient) => patient.id === pet.id) : pet.ownerEmail === email);
            const scopedPets = selectedPetId && selectedPetId !== "all" ? availablePets.filter((pet) => String(pet.id) === String(selectedPetId)) : availablePets;
            const petsForUser = scopedPets.slice(0, 12).map(({ id, name, type, breed, age, weight, notes, ownerName }) => ({ id, name, type, breed, age, weight, notes, ownerName }));
            const selectedPet = scopedPets[0];
            const matchesPetContext = (item) => !selectedPetId || selectedPetId === "all" || String(item.petId) === String(selectedPetId)
                || (selectedPet && item.petName && item.petName.toLowerCase() === selectedPet.name.toLowerCase()
                    && (isVeterinarian ? item.vetEmail === email : item.parentEmail === email));
            const appointmentsForUser = read("woofyAppointments").filter((item) =>
                (isVeterinarian ? item.vetEmail === email : item.parentEmail === email) && matchesPetContext(item)
            ).slice(-12).map(({ petName, vetName, parentName, dateTime, status, reason }) => ({
                petName, vetName, parentName, dateTime, status, reason
            }));
            const vaccinationsForUser = read("woofyVaccinations").filter((item) =>
                (isVeterinarian ? item.vetEmail === email : item.parentEmail === email) && matchesPetContext(item)
            ).slice(-20).map(({ petName, vaccineName, dateAdministered, nextDueDate, notes }) => ({
                petName, vaccineName, dateAdministered, nextDueDate, notes
            }));
            const recordsForUser = read("woofyMedicalRecords").filter((item) =>
                (isVeterinarian ? item.vetEmail === email : item.parentEmail === email) && matchesPetContext(item)
            ).slice(-20).map(({ petName, title, type, date, notes, prescription }) => ({
                petName, title, type, date, notes, prescription
            }));
            return {
                account: { firstName: currentUser?.name || "friend", role: currentUser?.role || "pet_parent" },
                petContext: selectedPetId === "all" ? "all pets" : (petsForUser[0]?.name || "no specific pet"),
                selectedPetId: selectedPetId || null,
                pets: petsForUser,
                appointments: appointmentsForUser,
                vaccinations: vaccinationsForUser,
                medicalRecords: recordsForUser
            };
        };
        refreshWoofyPetContextOptions = (preferredPetId = null) => {
            if (!woofyPetContextSelect) return;
            const previousValue = preferredPetId || woofyPetContextSelect.value;
            const availableForSelector = isVeterinarian ? getVetPatients() : readLocalArray("woofyPets").filter((pet) => pet.ownerEmail === currentUser.email);
            woofyPetContextSelect.replaceChildren(
                new Option("No specific pet", ""),
                new Option("🐾 All my pets", "all")
            );
            availableForSelector.forEach((pet) => {
                woofyPetContextSelect.appendChild(new Option(`${petEmoji(pet.type)} ${pet.name}`, pet.id));
            });
            if (previousValue && [...woofyPetContextSelect.options].some((option) => option.value === previousValue)) {
                woofyPetContextSelect.value = previousValue;
            } else {
                woofyPetContextSelect.value = "";
            }
        };
        refreshWoofyPetContextOptions();

        const sendWoofyQuestion = async (question) => {
            const cleaned = String(question || "").trim();
            if (!cleaned || !woofyWidgetMessages) return;
            addWoofyWidgetMessage(cleaned, "user");
            woofyHistory.push({ role: "user", content: cleaned });
            saveActiveWoofyThread();
            const historyForRequest = woofyHistory.slice(-10, -1);
            const contextForRequest = getWoofyPetContext();
            if (woofyPetContextSelect) woofyPetContextSelect.disabled = true;
            if (woofyWidgetQuestion) woofyWidgetQuestion.disabled = true;
            const sendButton = woofyWidgetForm?.querySelector('button[type="submit"]');
            if (sendButton) sendButton.disabled = true;
            const typing = addWoofyWidgetMessage("Ooo, let me sniff around for that… 🐾", "bot", "typing");
            if (woofyApiStatus) woofyApiStatus.textContent = "woofy is thinking…";
            try {
                const selectedPetId = woofyPetContextSelect?.value;
                const response = await fetch(WOOFY_AI_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
                    body: JSON.stringify({
                        question: cleaned,
                        conversation_id: activeWoofyConversationId,
                        pet_id: selectedPetId && selectedPetId !== "all" ? Number(selectedPetId) : null,
                        history: historyForRequest,
                        user_context: contextForRequest
                    })
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.detail || "woofy couldn't reach the AI service just now.");
                typing?.remove();
                activeWoofyConversationId = payload.conversation_id || activeWoofyConversationId;
                const answer = payload.answer || "Oopsie! I didn't get a reply that time. Try again?";
                addWoofyWidgetMessage(answer, "bot");
                woofyHistory.push({ role: "assistant", content: answer });
                saveActiveWoofyThread();
                if (woofyApiStatus) woofyApiStatus.textContent = "Connected to woofy AI ✨";
            } catch (error) {
                typing?.remove();
                addWoofyWidgetMessage(
                    error.message.includes("Failed to fetch")
                        ? "I can't reach my woofy brain just yet! 🥺 Please make sure the woofy API server is running, then try again."
                        : `A tiny hiccup! ${error.message}`,
                    "bot"
                );
                if (woofyApiStatus) woofyApiStatus.textContent = "API connection needed";
            } finally {
                if (woofyWidgetQuestion) {
                    woofyWidgetQuestion.disabled = false;
                    woofyWidgetQuestion.focus();
                }
                if (sendButton) sendButton.disabled = false;
                if (woofyPetContextSelect) woofyPetContextSelect.disabled = false;
            }
        };

        woofyPetContextSelect?.addEventListener("change", () => {
            saveActiveWoofyThread();
            activeWoofyConversationId = null;
            loadWoofyThreadForCurrentContext();
        });
        loadWoofyThreadForCurrentContext();
        woofyFab?.addEventListener("click", () => setWoofyOpen(woofyWidget?.hidden));
        woofyClose?.addEventListener("click", () => setWoofyOpen(false));
        document.querySelectorAll("[data-open-woofy-chat]").forEach((link) => {
            link.addEventListener("click", (event) => { event.preventDefault(); setWoofyOpen(true); });
        });
        woofyWidgetForm?.addEventListener("submit", (event) => {
            event.preventDefault();
            const question = woofyWidgetQuestion?.value || "";
            if (woofyWidgetQuestion) woofyWidgetQuestion.value = "";
            sendWoofyQuestion(question);
        });
        document.querySelectorAll("#woofyWidgetSuggestions [data-ai-question]").forEach((button) => {
            button.addEventListener("click", () => sendWoofyQuestion(button.dataset.aiQuestion || ""));
        });
        woofyClearChat?.addEventListener("click", async () => {
            try {
                if (activeWoofyConversationId) await apiRequest(`/api/ai/conversations/${activeWoofyConversationId}`, { method: "DELETE" });
                const threads = readWoofyThreads();
                delete threads[activeWoofyThreadKey];
                localStorage.setItem("woofyChatThreads", JSON.stringify(threads));
                woofyHistory = [];
                activeWoofyConversationId = null;
                renderActiveWoofyThread();
            } catch (error) { showApiError(error); }
        });
        // Desktop: drag the chat by its header; CSS resize grip adjusts dimensions.
        if (woofyWidget && window.matchMedia("(min-width: 601px)").matches) {
            const header = woofyWidget.querySelector(".woofy-widget-header");
            let drag = null;
            header?.addEventListener("pointerdown", (event) => {
                if (event.target.closest("button")) return;
                const rect = woofyWidget.getBoundingClientRect();
                drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
                header.setPointerCapture(event.pointerId);
                Object.assign(woofyWidget.style, { left: `${rect.left}px`, top: `${rect.top}px`, right: "auto", bottom: "auto" });
            });
            header?.addEventListener("pointermove", (event) => {
                if (!drag) return;
                const left = Math.max(0, Math.min(window.innerWidth - woofyWidget.offsetWidth, drag.left + event.clientX - drag.x));
                const top = Math.max(0, Math.min(window.innerHeight - woofyWidget.offsetHeight, drag.top + event.clientY - drag.y));
                woofyWidget.style.left = `${left}px`; woofyWidget.style.top = `${top}px`;
            });
            header?.addEventListener("pointerup", () => { drag = null; });
            header?.addEventListener("pointercancel", () => { drag = null; });
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && woofyWidget && !woofyWidget.hidden) setWoofyOpen(false);
        });


    } else if (welcomeName && currentUser) {
        welcomeName.textContent = currentUser.name;
    }


    /* ================================
       10. LOGOUT
    ================================= */

    const logoutButton = document.querySelector("#logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("woofyLoggedIn");
            localStorage.removeItem("woofyCurrentUser");
            localStorage.removeItem("woofyAccessToken");
            window.location.href = "index.html";
        });
    }


    /* ================================
       11. FAQ ACCORDION
    ================================= */

    document.querySelectorAll(".faq-question").forEach((question) => {
        question.addEventListener("click", () => {
            const item = question.closest(".faq-item");
            const isOpen = item.classList.contains("is-open");

            document.querySelectorAll(".faq-item.is-open").forEach((openItem) => {
                openItem.classList.remove("is-open");
                openItem.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
            });

            if (!isOpen) {
                item.classList.add("is-open");
                question.setAttribute("aria-expanded", "true");
            }
        });
    });


    /* ================================
       12. SMOOTH ANCHOR SCROLL
    ================================= */

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");
            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });


    /* ================================
       12. LITTLE RANDOM HELLO
    ================================= */

    console.log(
        "%c🐾 woofy 🐾",
        "font-family: Fredoka; font-size: 28px; font-weight: bold;"
    );

    console.log(
        "%cBuilt with too much love for pets.",
        "font-family: DM Sans; font-size: 14px;"
    );

});


/* =========================================
   HELPER — FORM MESSAGE
========================================= */

function showMessage(message, type = "success") {

    const oldMessage =
        document.querySelector(".woofy-message");

    if (oldMessage) {
        oldMessage.remove();
    }

    const messageBox =
        document.createElement("div");

    messageBox.className =
        "woofy-message";

    messageBox.textContent =
        message;

    messageBox.style.position = "fixed";
    messageBox.style.bottom = "25px";
    messageBox.style.left = "50%";
    messageBox.style.transform =
        "translateX(-50%) translateY(20px)";
    messageBox.style.zIndex = "10000";

    messageBox.style.padding =
        "15px 22px";

    messageBox.style.borderRadius =
        "999px";

    messageBox.style.fontFamily =
        "'DM Sans', sans-serif";

    messageBox.style.fontWeight =
        "600";

    messageBox.style.fontSize =
        "14px";

    messageBox.style.boxShadow =
        "0 15px 35px rgba(61,42,26,.15)";

    messageBox.style.opacity = "0";

    if (type === "error") {

        messageBox.style.background =
            "#ffc9b7";

    } else {

        messageBox.style.background =
            "#b9e5c7";

    }

    document.body.appendChild(messageBox);

    requestAnimationFrame(() => {

        messageBox.style.transition =
            "opacity .3s ease, transform .3s ease";

        messageBox.style.opacity = "1";

        messageBox.style.transform =
            "translateX(-50%) translateY(0)";

    });

    setTimeout(() => {

        messageBox.style.opacity = "0";

        messageBox.style.transform =
            "translateX(-50%) translateY(20px)";

        setTimeout(() => {
            messageBox.remove();
        }, 300);

    }, 2500);

}