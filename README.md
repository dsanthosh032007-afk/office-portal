# 🏢 Office Notice Portal - College Mini-Project

A clean, responsive, and fully functional administrative bulletin board and notice management web application built using **HTML5, CSS3, and Vanilla JavaScript (ES6)** with **HTML5 Web Storage (`localStorage`)**.

> 📌 **Academic Prototype Disclaimer**: This project is developed as an educational college mini-project. It runs entirely on the client side using the browser's `localStorage` API. It does not connect to a multi-tenant cloud database or remote authentication backend.

---

## 🌟 Key Features

1. **Professional Office Notice Dashboard**:
   - Modern corporate intranet layout with KPI overview cards (Total Notices, Urgent Alerts, Scheduled Events/Exams, Holidays).
2. **Complete Notice Details**:
   - Displays **Title**, **Category**, **Date**, **Description**, **Priority**, and **Issuing Department / Author**.
3. **Full CRUD Notice Management**:
   - **Create**: Publish announcements with validation rules.
   - **Read**: Dynamic responsive notice cards feed.
   - **Update (Edit Mode)**: Click "Edit" on any notice to populate the form, switch to update mode, make edits, and save changes.
   - **Delete**: Individual notice removal with a modal confirmation dialog.
4. **Instant Title & Keyword Search**:
   - Real-time search across notice titles, descriptions, and issuing departments.
5. **Multi-Category Filters**:
   - Dedicated filter tabs for **General**, **Events**, **Exams**, and **Holidays** (plus "All").
6. **Urgent Priority Visual Highlights**:
   - Urgent notices feature a **glowing red pulse dot**, a bold red accent left border, and an eye-catching `🚨 URGENT NOTICE` alert ribbon.
7. **4 Pre-Seeded Realistic Sample Notices**:
   - Automatically loaded on first launch (Exams timetable, Tech Fest hackathon, Public holiday, and Campus RFID rules).
8. **Permanent LocalStorage Persistence**:
   - All published, edited, and deleted notices remain saved in the browser across page reloads.
9. **Reset & Load Demo Data**:
   - One-click **"Load Samples"** to restore default notices anytime.
   - **"Clear All"** option to wipe stored notices.
10. **Responsive Design**:
    - Optimized for laptops, tablets, and mobile devices using CSS Grid and Flexbox.

---

## 📁 File Structure

```text
office-portal/
├── index.html        # Semantic HTML5 markup, KPI cards, notice form, and feed layout
├── style.css         # Modern styling, category/priority color tokens, urgent pulse animation
├── script.js         # ES6 CRUD logic, DOM manipulation, search/filter engine, localStorage
├── server.js         # Zero-dependency local Node.js static HTTP server (Port 8082)
└── README.md         # Documentation, run guide, and College Viva Q&A
```

---

## 🚀 How to Run the Project

### Method 1: Local HTTP Server (Recommended)
In PowerShell:
```powershell
node server.js
```
Then open your browser to: **[http://localhost:8082](http://localhost:8082)**

### Method 2: Double-Click
1. Open the project folder:
   `c:\Users\THARUN\Downloads\santhosh projects\office portal`
2. **Double-click `index.html`** to open directly in Google Chrome, Microsoft Edge, or Firefox.

---

## 🎓 College Viva / Technical Q&A Guide

Common questions examiners and professors ask for this project:

### 1. What architecture does this application follow?
> **Answer**: The application follows a **Client-Side MVC (Model-View-Controller)** pattern implemented in Vanilla JavaScript:
> - **Model**: The `notices` array and `localStorage` JSON storage.
> - **View**: Semantic HTML5 DOM elements dynamically manipulated via `document.createElement()` and `innerHTML`.
> - **Controller**: Event listeners coordinating form inputs, validation, search queries, category filters, and state persistence.

### 2. How are notices saved and restored without a database?
> **Answer**: It utilizes the browser's **HTML5 `localStorage`** API under the key `office_notice_portal_items_v1`.
> - **Save**: `localStorage.setItem(STORAGE_KEY, JSON.stringify(notices))` serializes JavaScript objects into a string.
> - **Restore**: `JSON.parse(localStorage.getItem(STORAGE_KEY))` deserializes the stored string back into JavaScript objects when the page loads.

### 3. How does the Edit feature work seamlessly without page reloads?
> **Answer**: When an administrator clicks the **"Edit"** button on a notice card, the `enterEditMode(id)` function:
> 1. Retrieves the target notice by its unique ID.
> 2. Fills the form inputs with the existing notice data.
> 3. Stores the ID in a hidden input `<input type="hidden" id="noticeId">`.
> 4. Updates form labels to "Edit Notice" and displays a "Cancel Edit" button.
> 5. On submission, the handler checks if `noticeId` exists; if so, it updates the existing object instead of creating a new one.

### 4. How does the real-time search and category filtering work?
> **Answer**: The `getFilteredNotices()` function uses JavaScript's `Array.prototype.filter()`:
> - Checks if the lowercase search term is a substring of the title, description, or department.
> - Verifies that the notice category matches the active tab (`General`, `Events`, `Exams`, `Holidays`, or `all`).
> - Verifies the priority level matches the selected dropdown.
> The filtered array is then rendered to the DOM without modifying the master dataset.

### 5. Why is Event Delegation used for Edit and Delete buttons?
> **Answer**: Since notice cards are created dynamically in the DOM, adding individual listeners to every new button would be inefficient and memory-intensive. Instead, a single listener on the parent container (`noticesFeedContainer`) captures clicks and identifies the target button using `e.target.closest('.btn-icon-action')` and `data-id`.

---

## 💻 Tech Stack Summary

- **HTML5**: Semantic tags (`<header>`, `<main>`, `<section>`, `<aside>`, `<article>`, `<textarea>`).
- **CSS3**: Custom Properties (Variables), Flexbox, CSS Grid, Pulse animations, Modal dialogs.
- **JavaScript**: ES6 (Arrow functions, Template Literals, Destructuring, Event Delegation, LocalStorage API).
