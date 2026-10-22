/**
 * ============================================================================
 * Office Notice Portal - Client-side Administration
 * College Mini-Project (Vanilla JavaScript & LocalStorage)
 * ============================================================================
 * 
 * Technical Implementation:
 * - Full CRUD Notice Management (Create, Read, Update, Delete)
 * - HTML5 Web Storage API (localStorage)
 * - Real-Time Title Substring Search & Category Multi-Filters
 * - Urgent Priority Visual Highlighting & Pulsing Alerts
 * - Modal Dialog Confirmation & Toast Feedback
 * ============================================================================
 */

'use strict';

/* --------------------------------------------------------------------------
   1. CONSTANTS & INITIAL SAMPLE NOTICES
   -------------------------------------------------------------------------- */
const STORAGE_KEY = 'office_notice_portal_items_v1';

function getTodayIsoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().split('T')[0];
}

const DEFAULT_SAMPLE_NOTICES = [
  {
    id: 'notice_sample_1',
    title: 'End-Semester Examination Schedule Announced',
    category: 'Exams',
    priority: 'Urgent',
    date: getTodayIsoDate(0),
    department: 'Controller of Examinations',
    description: 'All final year and pre-final year students are hereby informed that the End-Semester Laboratory and Theory Examination timetable has been officially finalized. Students must clear library dues and collect their hall tickets from the departmental coordinator before 4:00 PM this Friday. Identity card is strictly mandatory for hall ticket issuance.'
  },
  {
    id: 'notice_sample_2',
    title: 'Annual College Tech Fest & 24hr Hackathon Registration',
    category: 'Events',
    priority: 'High',
    date: getTodayIsoDate(2),
    department: 'Student Activity Council',
    description: 'Registrations are now open for "INNOVEX 2026", our national-level annual technical festival. Key events include a 24-hour Web & AI Hackathon, Paper Presentation, and Robotics Arena. Teams of 2 to 4 members can register online through the student portal. Grand prize pool worth ₹1,00,000 awaits winners.'
  },
  {
    id: 'notice_sample_3',
    title: 'Campus Closed in Observance of Public Holiday',
    category: 'Holidays',
    priority: 'Normal',
    date: getTodayIsoDate(-3), // upcoming
    department: 'Registrar Office',
    description: 'The administrative offices, central library, laboratory facilities, and regular academic classrooms will remain closed on the upcoming Monday in observance of the declared national holiday. Regular academic operations, examinations, and transport services will resume on Tuesday as per the standard schedule.'
  },
  {
    id: 'notice_sample_4',
    title: 'Mandatory RFID Identity Card Verification at Campus Gates',
    category: 'General',
    priority: 'Normal',
    date: getTodayIsoDate(5),
    department: 'Campus Security & Administration',
    description: 'In accordance with updated campus safety and surveillance protocols, all students, teaching faculty, and non-teaching personnel must visibly wear and scan their RFID smart identity cards at the turnstile gates upon entering campus. Temporary visitor passes must be obtained from Gate 1.'
  }
];

/* --------------------------------------------------------------------------
   2. APPLICATION STATE
   -------------------------------------------------------------------------- */
let notices = [];
let pendingDeleteId = null;

const filterState = {
  searchQuery: '',
  category: 'all',     // 'all' | 'General' | 'Events' | 'Exams' | 'Holidays'
  priority: 'all'      // 'all' | 'Urgent' | 'High' | 'Normal' | 'Low'
};

/* --------------------------------------------------------------------------
   3. DOM ELEMENT REFERENCES
   -------------------------------------------------------------------------- */
const el = {
  // KPIs
  totalNoticesCount: document.getElementById('totalNoticesCount'),
  urgentNoticesCount: document.getElementById('urgentNoticesCount'),
  eventsExamsCount: document.getElementById('eventsExamsCount'),
  holidaysCount: document.getElementById('holidaysCount'),
  eventsBreakdownText: document.getElementById('eventsBreakdownText'),

  // Header Actions
  btnLoadDemo: document.getElementById('btnLoadDemo'),
  btnResetAll: document.getElementById('btnResetAll'),

  // Form Elements
  formCard: document.getElementById('formCard'),
  formTitleText: document.getElementById('formTitleText'),
  formSubtitleText: document.getElementById('formSubtitleText'),
  btnCancelEdit: document.getElementById('btnCancelEdit'),
  noticeForm: document.getElementById('noticeForm'),
  noticeId: document.getElementById('noticeId'),
  noticeTitle: document.getElementById('noticeTitle'),
  noticeCategory: document.getElementById('noticeCategory'),
  noticePriority: document.getElementById('noticePriority'),
  noticeDate: document.getElementById('noticeDate'),
  noticeDepartment: document.getElementById('noticeDepartment'),
  noticeDescription: document.getElementById('noticeDescription'),
  btnSubmitNotice: document.getElementById('btnSubmitNotice'),
  btnSubmitText: document.getElementById('btnSubmitText'),

  // Error Message Elements
  titleError: document.getElementById('titleError'),
  categoryError: document.getElementById('categoryError'),
  priorityError: document.getElementById('priorityError'),
  dateError: document.getElementById('dateError'),
  descError: document.getElementById('descError'),

  // Search & Filter Toolbar
  searchNoticeInput: document.getElementById('searchNoticeInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  categoryTabs: document.querySelectorAll('.cat-tab'),
  priorityFilterSelect: document.getElementById('priorityFilterSelect'),
  filterNoticeBar: document.getElementById('filterNoticeBar'),
  activeFilterText: document.getElementById('activeFilterText'),
  btnResetFilters: document.getElementById('btnResetFilters'),

  // Notices Feed & Empty State
  noticesFeedContainer: document.getElementById('noticesFeedContainer'),
  emptyNoticeState: document.getElementById('emptyNoticeState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyDesc: document.getElementById('emptyDesc'),

  // Modal Dialog
  confirmModal: document.getElementById('confirmModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalMessage: document.getElementById('modalMessage'),
  modalBtnCancel: document.getElementById('modalBtnCancel'),
  modalBtnConfirm: document.getElementById('modalBtnConfirm'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer')
};

/* --------------------------------------------------------------------------
   4. LOCALSTORAGE MANAGEMENT
   -------------------------------------------------------------------------- */
function loadNoticesFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      saveNoticesToStorage(DEFAULT_SAMPLE_NOTICES);
      return JSON.parse(JSON.stringify(DEFAULT_SAMPLE_NOTICES));
    }
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : JSON.parse(JSON.stringify(DEFAULT_SAMPLE_NOTICES));
  } catch (err) {
    console.error('Error loading notices from storage:', err);
    return JSON.parse(JSON.stringify(DEFAULT_SAMPLE_NOTICES));
  }
}

function saveNoticesToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error writing notices to storage:', err);
    showToast('Failed to save to localStorage. Storage might be full.', 'danger');
  }
}

/* --------------------------------------------------------------------------
   5. DATE & FORMATTING HELPERS
   -------------------------------------------------------------------------- */
function formatDisplayDate(isoString) {
  if (!isoString) return '-';
  const parts = isoString.split('-');
  if (parts.length !== 3) return isoString;

  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(dateObj.getTime())) return isoString;

  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* --------------------------------------------------------------------------
   6. FORM VALIDATION & HANDLING (CREATE & UPDATE)
   -------------------------------------------------------------------------- */
function clearValidationErrors() {
  [el.noticeTitle, el.noticeCategory, el.noticePriority, el.noticeDate, el.noticeDescription].forEach(input => {
    if (input) input.classList.remove('input-error');
  });

  el.titleError.textContent = '';
  el.categoryError.textContent = '';
  el.priorityError.textContent = '';
  el.dateError.textContent = '';
  el.descError.textContent = '';
}

function validateForm() {
  clearValidationErrors();
  let isValid = true;

  // Title validation
  const title = el.noticeTitle.value.trim();
  if (!title) {
    el.noticeTitle.classList.add('input-error');
    el.titleError.textContent = 'Notice title is required.';
    isValid = false;
  } else if (title.length < 3) {
    el.noticeTitle.classList.add('input-error');
    el.titleError.textContent = 'Title must be at least 3 characters.';
    isValid = false;
  }

  // Category validation
  if (!el.noticeCategory.value) {
    el.noticeCategory.classList.add('input-error');
    el.categoryError.textContent = 'Please choose a category.';
    isValid = false;
  }

  // Priority validation
  if (!el.noticePriority.value) {
    el.noticePriority.classList.add('input-error');
    el.priorityError.textContent = 'Please select a priority level.';
    isValid = false;
  }

  // Date validation
  if (!el.noticeDate.value) {
    el.noticeDate.classList.add('input-error');
    el.dateError.textContent = 'Please select a valid date.';
    isValid = false;
  }

  // Description validation
  const desc = el.noticeDescription.value.trim();
  if (!desc) {
    el.noticeDescription.classList.add('input-error');
    el.descError.textContent = 'Notice description content is required.';
    isValid = false;
  } else if (desc.length < 10) {
    el.noticeDescription.classList.add('input-error');
    el.descError.textContent = 'Description must be at least 10 characters.';
    isValid = false;
  }

  return isValid;
}

function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    showToast('Please correct the highlighted form errors.', 'danger');
    return;
  }

  const editId = el.noticeId.value;

  if (editId) {
    // UPDATE MODE
    const target = notices.find(n => n.id === editId);
    if (target) {
      target.title = el.noticeTitle.value.trim();
      target.category = el.noticeCategory.value;
      target.priority = el.noticePriority.value;
      target.date = el.noticeDate.value;
      target.department = el.noticeDepartment.value.trim() || 'Administration';
      target.description = el.noticeDescription.value.trim();

      saveNoticesToStorage(notices);
      renderAll();
      resetFormToCreateMode();
      showToast(`Updated notice: "${target.title}"`, 'success');
    }
  } else {
    // CREATE MODE
    const newNotice = {
      id: 'notice_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: el.noticeTitle.value.trim(),
      category: el.noticeCategory.value,
      priority: el.noticePriority.value,
      date: el.noticeDate.value,
      department: el.noticeDepartment.value.trim() || 'Administration',
      description: el.noticeDescription.value.trim()
    };

    notices.unshift(newNotice);
    saveNoticesToStorage(notices);
    renderAll();
    resetFormToCreateMode();
    showToast(`Published new notice: "${newNotice.title}"`, 'success');
  }
}

/**
 * Enters Edit Mode for an existing notice.
 */
function enterEditMode(id) {
  const item = notices.find(n => n.id === id);
  if (!item) return;

  clearValidationErrors();

  el.noticeId.value = item.id;
  el.noticeTitle.value = item.title;
  el.noticeCategory.value = item.category;
  el.noticePriority.value = item.priority;
  el.noticeDate.value = item.date;
  el.noticeDepartment.value = item.department || '';
  el.noticeDescription.value = item.description;

  // Change UI to Edit Mode
  el.formTitleText.textContent = 'Edit Notice';
  el.formSubtitleText.textContent = `Modifying notice record: ${item.title.substring(0, 30)}...`;
  el.btnSubmitText.textContent = 'Update Notice';
  el.btnCancelEdit.style.display = 'inline-block';

  // Smooth scroll form into view
  el.formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.noticeTitle.focus();

  showToast(`Editing notice: "${item.title}"`, 'info');
}

/**
 * Resets form back to standard Create/Publish mode.
 */
function resetFormToCreateMode() {
  clearValidationErrors();

  el.noticeId.value = '';
  el.noticeTitle.value = '';
  el.noticeCategory.value = 'General';
  el.noticePriority.value = 'Normal';
  el.noticeDate.value = getTodayIsoDate(0);
  el.noticeDepartment.value = 'Office Administration';
  el.noticeDescription.value = '';

  el.formTitleText.textContent = 'Post New Notice';
  el.formSubtitleText.textContent = 'Broadcast an announcement to the office';
  el.btnSubmitText.textContent = 'Publish Notice';
  el.btnCancelEdit.style.display = 'none';
}

/* --------------------------------------------------------------------------
   7. RENDERING FUNCTIONS (KPIS & NOTICES FEED)
   -------------------------------------------------------------------------- */
/**
 * Computes counts and updates KPI metric cards at top of dashboard.
 */
function renderKpiMetrics() {
  let urgentCount = 0;
  let eventsCount = 0;
  let examsCount = 0;
  let holidaysCount = 0;

  notices.forEach(n => {
    if (n.priority === 'Urgent') urgentCount++;
    if (n.category === 'Events') eventsCount++;
    if (n.category === 'Exams') examsCount++;
    if (n.category === 'Holidays') holidaysCount++;
  });

  el.totalNoticesCount.textContent = notices.length;
  el.urgentNoticesCount.textContent = urgentCount;
  el.eventsExamsCount.textContent = eventsCount + examsCount;
  el.eventsBreakdownText.textContent = `${eventsCount} Events • ${examsCount} Exams`;
  el.holidaysCount.textContent = holidaysCount;
}

/**
 * Filters notices by search query, category, and priority.
 */
function getFilteredNotices() {
  const query = filterState.searchQuery.trim().toLowerCase();

  return notices.filter(n => {
    // 1. Text Substring Search (title, department, description)
    if (query) {
      const matchTitle = n.title.toLowerCase().includes(query);
      const matchDept = (n.department || '').toLowerCase().includes(query);
      const matchDesc = n.description.toLowerCase().includes(query);
      if (!matchTitle && !matchDept && !matchDesc) {
        return false;
      }
    }

    // 2. Category Filter
    if (filterState.category !== 'all' && n.category !== filterState.category) {
      return false;
    }

    // 3. Priority Filter
    if (filterState.priority !== 'all' && n.priority !== filterState.priority) {
      return false;
    }

    return true;
  });
}

/**
 * Builds and renders the cards in the notice feed.
 */
function renderNoticesFeed() {
  const filtered = getFilteredNotices();
  el.noticesFeedContainer.innerHTML = '';

  // Update active filter notice bar
  const hasActiveFilters = Boolean(
    filterState.searchQuery || 
    filterState.category !== 'all' || 
    filterState.priority !== 'all'
  );

  if (hasActiveFilters) {
    el.filterNoticeBar.style.display = 'flex';
    const parts = [];
    if (filterState.searchQuery) parts.push(`"${filterState.searchQuery}"`);
    if (filterState.category !== 'all') parts.push(`Category: ${filterState.category}`);
    if (filterState.priority !== 'all') parts.push(`Priority: ${filterState.priority}`);
    el.activeFilterText.textContent = `Showing ${filtered.length} of ${notices.length} notices (${parts.join(', ')})`;
  } else {
    el.filterNoticeBar.style.display = 'none';
  }

  // Handle Empty State
  if (filtered.length === 0) {
    el.emptyNoticeState.style.display = 'block';
    if (notices.length === 0) {
      el.emptyTitle.textContent = 'No Notices on Bulletin Board';
      el.emptyDesc.textContent = 'Post your first office announcement using the form on the left, or click "Load Samples" above.';
    } else {
      el.emptyTitle.textContent = 'No Notices Match Filter';
      el.emptyDesc.textContent = 'No announcements matched your search terms or filter selection. Click "Reset Filters" to show all.';
    }
  } else {
    el.emptyNoticeState.style.display = 'none';
  }

  // Render Notice Cards
  filtered.forEach(notice => {
    const isUrgent = notice.priority === 'Urgent';
    const card = document.createElement('article');
    card.className = `notice-card ${isUrgent ? 'is-urgent' : ''}`;
    card.id = `card_${notice.id}`;

    card.innerHTML = `
      ${isUrgent ? `
        <div class="urgent-top-ribbon">
          <span class="pulse-dot"></span>
          <span>🚨 URGENT NOTICE &bull; IMMEDIATE ACTION REQUIRED</span>
        </div>
      ` : ''}

      <div class="notice-header-row">
        <div class="notice-meta-tags">
          <span class="badge-cat cat-${escapeHtml(notice.category)}">
            ${escapeHtml(notice.category)}
          </span>
          <span class="badge-prio prio-${escapeHtml(notice.priority)}">
            ${escapeHtml(notice.priority)}
          </span>
          <span class="notice-date">
            &bull; ${formatDisplayDate(notice.date)}
          </span>
        </div>

        <div class="notice-actions">
          <button 
            type="button" 
            class="btn-icon-action btn-edit" 
            data-action="edit" 
            data-id="${notice.id}" 
            title="Edit Notice"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Edit
          </button>

          <button 
            type="button" 
            class="btn-icon-action btn-delete" 
            data-action="delete" 
            data-id="${notice.id}" 
            title="Delete Notice"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>

      <h3 class="notice-title">${escapeHtml(notice.title)}</h3>

      <p class="notice-description">${escapeHtml(notice.description)}</p>

      <div class="notice-footer-row">
        <span class="notice-issuer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          ${escapeHtml(notice.department || 'Administration')}
        </span>

        <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;">
          ID: ${escapeHtml(notice.id.substring(0, 16))}
        </span>
      </div>
    `;

    el.noticesFeedContainer.appendChild(card);
  });
}

function renderAll() {
  renderKpiMetrics();
  renderNoticesFeed();
}

/* --------------------------------------------------------------------------
   8. MODAL DIALOG & DELETE HANDLING
   -------------------------------------------------------------------------- */
function promptDeleteNotice(id) {
  const item = notices.find(n => n.id === id);
  if (!item) return;

  pendingDeleteId = id;
  el.modalTitle.textContent = 'Confirm Delete Notice';
  el.modalMessage.textContent = `Are you sure you want to permanently delete the notice "${item.title}"? This cannot be undone.`;
  el.modalBtnConfirm.textContent = 'Delete Notice';
  el.confirmModal.style.display = 'flex';
}

function promptClearAllNotices() {
  if (notices.length === 0) {
    showToast('There are no notices to clear.', 'info');
    return;
  }

  pendingDeleteId = 'CLEAR_ALL';
  el.modalTitle.textContent = 'Clear All Notices';
  el.modalMessage.textContent = 'Are you sure you want to delete all notices from localStorage? This will wipe the entire bulletin board.';
  el.modalBtnConfirm.textContent = 'Clear All';
  el.confirmModal.style.display = 'flex';
}

function closeModal() {
  pendingDeleteId = null;
  el.confirmModal.style.display = 'none';
}

function executeConfirmedAction() {
  if (pendingDeleteId === 'CLEAR_ALL') {
    notices = [];
    saveNoticesToStorage(notices);
    renderAll();
    closeModal();
    resetFormToCreateMode();
    showToast('All notices cleared from localStorage.', 'danger');
    return;
  }

  if (pendingDeleteId) {
    const deletedIndex = notices.findIndex(n => n.id === pendingDeleteId);
    if (deletedIndex !== -1) {
      const deletedTitle = notices[deletedIndex].title;
      notices.splice(deletedIndex, 1);
      saveNoticesToStorage(notices);
      renderAll();

      // If the currently edited notice is deleted, reset form
      if (el.noticeId.value === pendingDeleteId) {
        resetFormToCreateMode();
      }

      showToast(`Deleted notice: "${deletedTitle}"`, 'info');
    }
    closeModal();
  }
}

/**
 * Restores initial sample notices.
 */
function loadDemoSampleNotices() {
  notices = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_NOTICES));
  saveNoticesToStorage(notices);
  resetFilters();
  resetFormToCreateMode();
  renderAll();
  showToast('Default sample notices restored successfully!', 'success');
}

/* --------------------------------------------------------------------------
   9. SEARCH & FILTER CONTROLS
   -------------------------------------------------------------------------- */
function resetFilters() {
  filterState.searchQuery = '';
  filterState.category = 'all';
  filterState.priority = 'all';

  el.searchNoticeInput.value = '';
  el.btnClearSearch.style.display = 'none';
  el.priorityFilterSelect.value = 'all';

  el.categoryTabs.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-category') === 'all');
  });

  renderNoticesFeed();
}

/* --------------------------------------------------------------------------
   10. TOAST NOTIFICATIONS
   -------------------------------------------------------------------------- */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2600);
}

/* --------------------------------------------------------------------------
   11. EVENT LISTENERS
   -------------------------------------------------------------------------- */
function setupEventListeners() {
  // 1. Form Submission & Cancel
  el.noticeForm.addEventListener('submit', handleFormSubmit);
  el.btnCancelEdit.addEventListener('click', resetFormToCreateMode);

  // 2. Real-time form error clearing
  el.noticeTitle.addEventListener('input', () => {
    if (el.noticeTitle.classList.contains('input-error')) {
      el.noticeTitle.classList.remove('input-error');
      el.titleError.textContent = '';
    }
  });

  el.noticeDescription.addEventListener('input', () => {
    if (el.noticeDescription.classList.contains('input-error')) {
      el.noticeDescription.classList.remove('input-error');
      el.descError.textContent = '';
    }
  });

  // 3. Search Input
  el.searchNoticeInput.addEventListener('input', (e) => {
    filterState.searchQuery = e.target.value;
    el.btnClearSearch.style.display = e.target.value ? 'block' : 'none';
    renderNoticesFeed();
  });

  el.btnClearSearch.addEventListener('click', () => {
    el.searchNoticeInput.value = '';
    filterState.searchQuery = '';
    el.btnClearSearch.style.display = 'none';
    renderNoticesFeed();
    el.searchNoticeInput.focus();
  });

  // 4. Category Tabs
  el.categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      el.categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterState.category = tab.getAttribute('data-category');
      renderNoticesFeed();
    });
  });

  // 5. Priority Select Filter
  el.priorityFilterSelect.addEventListener('change', (e) => {
    filterState.priority = e.target.value;
    renderNoticesFeed();
  });

  // 6. Reset Filters Button
  el.btnResetFilters.addEventListener('click', resetFilters);

  // 7. Demo Data & Reset Buttons
  el.btnLoadDemo.addEventListener('click', loadDemoSampleNotices);
  el.btnResetAll.addEventListener('click', promptClearAllNotices);

  // 8. Event Delegation on Notices Feed (Edit & Delete buttons)
  el.noticesFeedContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-icon-action');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');

    if (action === 'edit') {
      enterEditMode(id);
    } else if (action === 'delete') {
      promptDeleteNotice(id);
    }
  });

  // 9. Modal Confirm / Cancel
  el.modalBtnCancel.addEventListener('click', closeModal);
  el.modalBtnConfirm.addEventListener('click', executeConfirmedAction);
  el.confirmModal.addEventListener('click', (e) => {
    if (e.target === el.confirmModal) closeModal();
  });
}

/* --------------------------------------------------------------------------
   12. APPLICATION BOOTSTRAP
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today
  el.noticeDate.value = getTodayIsoDate(0);

  // Load notices from localStorage (seeds sample notices if first launch)
  notices = loadNoticesFromStorage();

  // Attach event handlers
  setupEventListeners();

  // Render initial dashboard
  renderAll();
});
