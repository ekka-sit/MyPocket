(function () {
  "use strict";

  /* ---------------------------------------------------------
   * Data & Global State
   * ------------------------------------------------------- */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MIN_YEAR = 2020;
  var CURRENT_YEAR = new Date().getFullYear();
  var MAX_YEAR = Math.max(CURRENT_YEAR, 2026);

  var state = {
    year: 2026,
    monthIndex: 8, // 0 = Jan, 8 = Sep
    mode: "expense",
    currentDaysData: []
  };

  // Modal Form State
  var editingTransactionId = null;
  var modalViewMode = 'add'; // 'add', 'detail', 'edit_amount'
  var modalType = 'expense';
  var expression = '';
  var selectedDate = new Date();
  var selectedImageFile = null;

  /* ---------------------------------------------------------
   * Element References
   * ------------------------------------------------------- */
  var menuToggle = document.getElementById("menuToggle");
  var overlay = document.getElementById("overlay");
  var sidebar = document.getElementById("sidebar");

  var yearTrigger = document.getElementById("yearTrigger");
  var yearList = document.getElementById("yearList");
  var monthTrigger = document.getElementById("monthTrigger");
  var monthList = document.getElementById("monthList");

  var pocketBadge = document.getElementById("pocketBadge");
  var expenseAmountEl = document.getElementById("expenseAmount");
  var incomeAmountEl = document.getElementById("incomeAmount");

  var dayList = document.getElementById("dayList");
  var fabAdd = document.getElementById("fabAdd");
  var fabIcon = document.getElementById("fabIcon");

  // Modal Elements
  var modalOverlay = document.getElementById("modalOverlay");
  var transactionModal = document.getElementById("transactionModal");
  var closeModalBtn = document.getElementById("closeModalBtn");
  var typeToggleBtn = document.getElementById("typeToggleBtn");
  var deleteTxBtn = document.getElementById("deleteTxBtn");
  
  var dateDisplay = document.getElementById("dateDisplay");
  var dateText = document.getElementById("dateText");
  var hiddenDatePicker = document.getElementById("hiddenDatePicker");
  
  var amountBoxContainer = document.getElementById("amountBoxContainer");
  var editAmountConfirmBtn = document.getElementById("editAmountConfirmBtn");
  var amountDisplay = document.getElementById("amountDisplay");
  var amountDeleteBtn = document.getElementById("amountDeleteBtn");
  
  var formInputsGroup = document.getElementById("formInputsGroup");
  var categorySelect = document.getElementById("categorySelect");
  var noteInput = document.getElementById("noteInput");
  
  var addModeImageSection = document.getElementById("addModeImageSection");
  var cameraBtn = document.getElementById("cameraBtn");
  var receiptInput = document.getElementById("receiptInput");
  var imagePreviewContainer = document.getElementById("imagePreviewContainer");
  var imagePreview = document.getElementById("imagePreview");
  var removeImageBtn = document.getElementById("removeImageBtn");

  var numpadGrid = document.getElementById("numpadGrid");
  var modalColRight = document.getElementById("modalColRight");
  var detailCameraBtn = document.getElementById("detailCameraBtn");
  var detailReceiptInput = document.getElementById("detailReceiptInput");
  var detailImagePreview = document.getElementById("detailImagePreview");
  var noImageText = document.getElementById("noImageText");

  var miniModalOverlay = document.getElementById("miniModalOverlay");
  var newCategoryInput = document.getElementById("newCategoryInput");
  var cancelCategoryBtn = document.getElementById("cancelCategoryBtn");
  var saveCategoryBtn = document.getElementById("saveCategoryBtn");

  /* ---------------------------------------------------------
   * Sidebar Menu Controls
   * ------------------------------------------------------- */
  function openMenu() {
    document.body.classList.add("menu-open");
    menuToggle.setAttribute("aria-expanded", "true");
    sidebar.setAttribute("aria-hidden", "false");
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    sidebar.setAttribute("aria-hidden", "true");
  }

  function toggleMenu() {
    if (document.body.classList.contains("menu-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  menuToggle.addEventListener("click", toggleMenu);
  overlay.addEventListener("click", closeMenu);

  sidebar.querySelectorAll(".sidebar-link").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      sidebar.querySelectorAll(".sidebar-link").forEach(function (el) {
        el.classList.remove("active");
      });
      link.classList.add("active");
      closeMenu();
    });
  });

  /* ---------------------------------------------------------
   * Popover Helper (Year / Month Pickers)
   * ------------------------------------------------------- */
  function closePicker(trigger, list) {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function openPicker(trigger, list) {
    closePicker(monthTrigger, monthList);
    closePicker(yearTrigger, yearList);
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  }

  function togglePicker(trigger, list) {
    if (list.hidden) {
      openPicker(trigger, list);
    } else {
      closePicker(trigger, list);
    }
  }

  document.addEventListener("click", function (event) {
    if (!yearList.hidden && !yearList.contains(event.target) && event.target !== yearTrigger) {
      closePicker(yearTrigger, yearList);
    }
    if (!monthList.hidden && !monthList.contains(event.target) && event.target !== monthTrigger) {
      closePicker(monthTrigger, monthList);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
      closePicker(yearTrigger, yearList);
      closePicker(monthTrigger, monthList);
      closeModal();
    }
  });

  function buildYearList() {
    yearList.innerHTML = "";
    for (var y = MAX_YEAR; y >= MIN_YEAR; y--) {
      (function (year) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-option" + (year === state.year ? " active" : "");
        btn.textContent = year;
        btn.setAttribute("role", "option");
        btn.addEventListener("click", function () {
          state.year = year;
          yearTrigger.textContent = year;
          closePicker(yearTrigger, yearList);
          buildYearList();
          loadDataAndRender();
        });
        li.appendChild(btn);
        yearList.appendChild(li);
      })(y);
    }
  }

  function buildMonthList() {
    monthList.innerHTML = "";
    MONTHS.forEach(function (label, index) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "picker-option" + (index === state.monthIndex ? " active" : "");
      btn.textContent = label;
      btn.setAttribute("role", "option");
      btn.addEventListener("click", function () {
        state.monthIndex = index;
        monthTrigger.textContent = label;
        closePicker(monthTrigger, monthList);
        buildMonthList();
        loadDataAndRender();
      });
      li.appendChild(btn);
      monthList.appendChild(li);
    });
  }

  yearTrigger.addEventListener("click", function (event) {
    event.stopPropagation();
    buildYearList();
    togglePicker(yearTrigger, yearList);
  });

  monthTrigger.addEventListener("click", function (event) {
    event.stopPropagation();
    buildMonthList();
    togglePicker(monthTrigger, monthList);
  });

  /* ---------------------------------------------------------
   * Pocket Badge — 3D Flip & Mode Switch
   * ------------------------------------------------------- */
  pocketBadge.addEventListener("click", function () {
    state.mode = state.mode === "expense" ? "income" : "expense";
    pocketBadge.setAttribute("aria-pressed", state.mode === "income" ? "true" : "false");
    renderDayList();
  });

  /* ---------------------------------------------------------
   * Database Integration & Data Transformation
   * ------------------------------------------------------- */
  function parseDbDate(dateVal) {
    if (!dateVal) return new Date();
    if (typeof dateVal === 'object' && dateVal.$date) return new Date(dateVal.$date);
    return new Date(dateVal);
  }

  function groupTransactions(rawList) {
    var dayMap = {};

    rawList.forEach(function (tx) {
      var d = parseDbDate(tx.date);
      var dateStr = d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();

      if (!dayMap[dateStr]) {
        dayMap[dateStr] = { date: dateStr, groupsMap: {} };
      }

      var catName = tx.category || "อื่นๆ";
      if (!dayMap[dateStr].groupsMap[catName]) {
        dayMap[dateStr].groupsMap[catName] = { name: catName, items: [] };
      }

      dayMap[dateStr].groupsMap[catName].items.push({
        id: tx._id || tx.id,
        name: (tx.note && tx.note.trim() !== "") ? tx.note : catName,
        amount: Number(tx.amount) || 0,
        type: tx.type || "expense",
        category: catName,
        note: tx.note || "",
        date: tx.date,
        imagePath: tx.imagePath || tx.imageUrl || tx.image || ""
      });
    });

    return Object.keys(dayMap).map(function (dateStr) {
      var dayObj = dayMap[dateStr];
      var groups = Object.keys(dayObj.groupsMap).map(function (catName) {
        return dayObj.groupsMap[catName];
      });
      return {
        date: dayObj.date,
        groups: groups
      };
    });
  }

  function loadDataAndRender() {
    var monthQuery = state.monthIndex + 1;
    var url = '/api/transactions?year=' + state.year + '&month=' + monthQuery;

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Fetch error");
        return res.json();
      })
      .then(function (rawTransactions) {
        state.currentDaysData = groupTransactions(rawTransactions);
        render();
      })
      .catch(function (err) {
        console.warn("ไม่สามารถดึงข้อมูลจาก Server ได้:", err);
        state.currentDaysData = [];
        render();
      });
  }

  /* ---------------------------------------------------------
   * Rendering Helpers (Accordion & Curved Tree View)
   * ------------------------------------------------------- */
  function formatAmount(value) {
    return Number(value).toLocaleString("en-US");
  }

  function filterDaysByMode(days, mode) {
    var result = [];

    days.forEach(function (day) {
      var groups = [];

      day.groups.forEach(function (group) {
        var items = group.items.filter(function (item) {
          return item.type === mode;
        });

        if (items.length > 0) {
          var total = items.reduce(function (sum, item) {
            return sum + item.amount;
          }, 0);
          groups.push({ name: group.name, total: total, items: items });
        }
      });

      if (groups.length > 0) {
        var dayTotal = groups.reduce(function (sum, group) {
          return sum + group.total;
        }, 0);
        result.push({ date: day.date, total: dayTotal, groups: groups });
      }
    });

    return result;
  }

  function computeMonthTotals(days) {
    var totals = { expense: 0, income: 0 };

    days.forEach(function (day) {
      day.groups.forEach(function (group) {
        group.items.forEach(function (item) {
          if (totals[item.type] !== undefined) {
            totals[item.type] += item.amount;
          }
        });
      });
    });

    return totals;
  }

  function updateBadgeAmounts() {
    var totals = computeMonthTotals(state.currentDaysData);
    expenseAmountEl.textContent = formatAmount(totals.expense);
    incomeAmountEl.textContent = formatAmount(totals.income);
  }

  function buildSubitems(items) {
    var ul = document.createElement("ul");
    ul.className = "tx-subitems";

    items.forEach(function (item) {
      var li = document.createElement("li");
      li.style.cursor = "pointer";

      var name = document.createElement("span");
      name.className = "tx-subitem-name";
      name.textContent = item.name;

      var amount = document.createElement("span");
      amount.className = "tx-subitem-amount";
      amount.textContent = formatAmount(item.amount);

      li.appendChild(name);
      li.appendChild(amount);

      li.addEventListener("click", function (e) {
        e.stopPropagation();
        openDetailModal(item);
      });

      ul.appendChild(li);
    });

    return ul;
  }

  function buildGroup(group) {
    var wrapper = document.createElement("div");
    wrapper.className = "tx-group";

    var header = document.createElement("div");
    header.className = "tx-group-header";

    var name = document.createElement("span");
    name.textContent = group.name;

    var total = document.createElement("span");
    total.textContent = formatAmount(group.total);

    header.appendChild(name);
    header.appendChild(total);
    wrapper.appendChild(header);
    wrapper.appendChild(buildSubitems(group.items));

    return wrapper;
  }

  function toggleDayCard(card) {
    var isOpen = card.classList.contains("open");
    var body = card.querySelector(".day-card-body");
    var arrow = card.querySelector(".day-arrow");
    var header = card.querySelector(".day-card-header");

    if (isOpen) {
      card.classList.remove("open");
      body.style.maxHeight = "0px";
      arrow.innerHTML = "&#9654;";
      header.setAttribute("aria-expanded", "false");
    } else {
      card.classList.add("open");
      arrow.innerHTML = "&#9660;";
      header.setAttribute("aria-expanded", "true");
      body.style.maxHeight = body.scrollHeight + "px";
    }
  }

  function buildDayCard(day, index, mode) {
    var card = document.createElement("article");
    card.className = "day-card";

    var header = document.createElement("button");
    header.type = "button";
    header.className = "day-card-header";
    header.setAttribute("aria-expanded", "false");

    var arrow = document.createElement("span");
    arrow.className = "day-arrow";
    arrow.innerHTML = "&#9654;";

    var date = document.createElement("span");
    date.className = "day-date";
    date.textContent = day.date;

    var totalWrap = document.createElement("span");
    totalWrap.className = "day-total";

    var coin = document.createElement("span");
    coin.className = "day-total-coin";
    coin.textContent = "$";

    var amount = document.createElement("span");
    amount.className = "day-total-amount day-total-amount--" + mode;
    amount.textContent = formatAmount(day.total);

    totalWrap.appendChild(coin);
    totalWrap.appendChild(amount);

    header.appendChild(arrow);
    header.appendChild(date);
    header.appendChild(totalWrap);

    var body = document.createElement("div");
    body.className = "day-card-body";

    day.groups.forEach(function (group) {
      body.appendChild(buildGroup(group));
    });

    card.appendChild(header);
    card.appendChild(body);

    header.addEventListener("click", function () {
      toggleDayCard(card);
    });

    if (index === 0) {
      window.requestAnimationFrame(function () {
        toggleDayCard(card);
      });
    }

    return card;
  }

  function renderDayList() {
    dayList.innerHTML = "";

    var days = filterDaysByMode(state.currentDaysData, state.mode);

    if (days.length === 0) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = state.mode === "expense"
        ? "ยังไม่มีรายการรายจ่ายในเดือนนี้"
        : "ยังไม่มีรายการรายรับในเดือนนี้";
      dayList.appendChild(empty);
      return;
    }

    days.forEach(function (day, index) {
      dayList.appendChild(buildDayCard(day, index, state.mode));
    });
  }

  function render() {
    updateBadgeAmounts();
    renderDayList();
  }

  /* ---------------------------------------------------------
   * Modal Form State & View Management
   * ------------------------------------------------------- */
  fabAdd.addEventListener("click", function () {
    if (modalOverlay.classList.contains("hidden")) {
      openAddModal();
    } else {
      submitTransaction();
    }
  });

  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  function openAddModal() {
    editingTransactionId = null;
    modalViewMode = 'add';
    modalType = state.mode;
    selectedDate = new Date();

    transactionModal.classList.remove('modal-detail-mode');
    document.body.classList.remove('modal-detail-open');

    deleteTxBtn.classList.add('hidden');
    modalColRight.classList.add('hidden');
    addModeImageSection.classList.remove('hidden');
    formInputsGroup.classList.remove('hidden');
    numpadGrid.classList.remove('hidden');

    editAmountConfirmBtn.classList.add('hidden');
    amountDeleteBtn.classList.remove('hidden');
    amountBoxContainer.classList.remove('clickable');

    resetForm();
    updateModalThemeUI();
    fetchCategories(modalType);
    updateDateDisplay(selectedDate);

    modalOverlay.classList.remove("hidden");
    fabAdd.classList.add("active");
    fabIcon.textContent = "✓";
  }

  function openDetailModal(txItem) {
    resetForm();

    editingTransactionId = txItem.id;
    modalViewMode = 'detail';
    modalType = txItem.type;
    selectedDate = parseDbDate(txItem.date);

    transactionModal.classList.add('modal-detail-mode');
    document.body.classList.add('modal-detail-open');

    deleteTxBtn.classList.remove('hidden');
    modalColRight.classList.remove('hidden');
    addModeImageSection.classList.add('hidden');
    formInputsGroup.classList.remove('hidden');
    numpadGrid.classList.add('hidden');

    editAmountConfirmBtn.classList.add('hidden');
    amountDeleteBtn.classList.add('hidden');
    amountBoxContainer.classList.add('clickable');

    expression = String(txItem.amount || 0);
    amountDisplay.textContent = formatAmount(txItem.amount || 0);
    noteInput.value = txItem.note || '';

    updateModalThemeUI();
    updateDateDisplay(selectedDate);

    fetchCategories(modalType, function () {
      categorySelect.value = txItem.category || '';
    });

    if (txItem.imagePath) {
      detailImagePreview.src = txItem.imagePath;
      detailImagePreview.classList.remove('hidden');
      noImageText.classList.add('hidden');
    } else {
      detailImagePreview.src = '';
      detailImagePreview.classList.add('hidden');
      noImageText.classList.remove('hidden');
    }

    modalOverlay.classList.remove("hidden");
    fabAdd.classList.add("active");
    fabIcon.textContent = "✓";
  }

  function enterEditAmountMode() {
    if (modalViewMode !== 'detail') return;
    modalViewMode = 'edit_amount';

    editAmountConfirmBtn.classList.remove('hidden');
    amountDeleteBtn.classList.remove('hidden');
    amountBoxContainer.classList.remove('clickable');

    formInputsGroup.classList.add('hidden');
    numpadGrid.classList.remove('hidden');
  }

  function exitEditAmountMode() {
    if (modalViewMode !== 'edit_amount') return;
    calculateResult();
    modalViewMode = 'detail';

    editAmountConfirmBtn.classList.add('hidden');
    amountDeleteBtn.classList.add('hidden');
    amountBoxContainer.classList.add('clickable');

    numpadGrid.classList.add('hidden');
    formInputsGroup.classList.remove('hidden');
  }

  amountBoxContainer.addEventListener('click', function (e) {
    if (e.target.closest('#editAmountConfirmBtn') || e.target.closest('#amountDeleteBtn')) return;
    if (modalViewMode === 'detail') {
      enterEditAmountMode();
    }
  });

  editAmountConfirmBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    exitEditAmountMode();
  });

  amountDeleteBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    expression = expression.slice(0, -1);
    amountDisplay.textContent = expression || '0';
  });

  deleteTxBtn.addEventListener('click', function () {
    if (!editingTransactionId) return;
    if (confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      fetch('/api/transactions/' + editingTransactionId, {
        method: 'DELETE'
      })
      .then(function (res) {
        if (res.ok) {
          closeModal();
          loadDataAndRender();
        } else {
          alert('ลบรายการไม่สำเร็จ');
        }
      })
      .catch(function (err) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        console.error(err);
      });
    }
  });

  function closeModal() {
    modalOverlay.classList.add("hidden");
    fabAdd.classList.remove("active", "active-income");
    fabIcon.textContent = "+";
    transactionModal.classList.remove('modal-detail-mode');
    document.body.classList.remove('modal-detail-open');
    resetForm();
  }

  function updateModalThemeUI() {
    if (modalType === 'expense') {
      transactionModal.className = 'modal-card modal-expense' + (modalViewMode === 'detail' || modalViewMode === 'edit_amount' ? ' modal-detail-mode' : '');
      typeToggleBtn.textContent = 'รายจ่าย';
      fabAdd.classList.remove('active-income');
    } else {
      transactionModal.className = 'modal-card modal-income' + (modalViewMode === 'detail' || modalViewMode === 'edit_amount' ? ' modal-detail-mode' : '');
      typeToggleBtn.textContent = 'รายรับ';
      fabAdd.classList.add('active-income');
    }
  }

  typeToggleBtn.addEventListener("click", function () {
    modalType = modalType === 'expense' ? 'income' : 'expense';
    updateModalThemeUI();
    fetchCategories(modalType);
  });

  /* ---------- แก้ไขการเปิดหน้าต่าง Calendar Date Picker ---------- */
  dateDisplay.addEventListener("click", function () {
    if (typeof hiddenDatePicker.showPicker === "function") {
      try {
        hiddenDatePicker.showPicker();
      } catch (err) {
        hiddenDatePicker.focus();
      }
    } else {
      hiddenDatePicker.focus();
    }
  });

  hiddenDatePicker.addEventListener("change", function (e) {
    if (e.target.value) {
      selectedDate = new Date(e.target.value);
      updateDateDisplay(selectedDate);
    }
    hiddenDatePicker.blur();
  });

  function updateDateDisplay(dateObj) {
    var day = String(dateObj.getDate()).padStart(2, '0');
    var month = MONTHS[dateObj.getMonth()];
    var year = dateObj.getFullYear();
    dateText.textContent = day + " / " + month + " / " + year;
    hiddenDatePicker.value = dateObj.toISOString().split('T')[0];
  }

  document.querySelectorAll('.numpad-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      handleNumpadInput(btn.getAttribute('data-val'));
    });
  });

  document.addEventListener('keydown', function (e) {
    if (modalOverlay.classList.contains('hidden')) return;

    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')) {
      if (active !== hiddenDatePicker) {
        return;
      }
    }

    if ((e.key >= '0' && e.key <= '9') || ['.', '+', '-', '*', '/'].includes(e.key)) {
      handleNumpadInput(e.key);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (expression && /[+\-*/]/.test(expression)) {
        calculateResult();
      } else {
        submitTransaction();
      }
    } else if (e.key === 'Backspace') {
      expression = expression.slice(0, -1);
      amountDisplay.textContent = expression || '0';
    }
  });

  function handleNumpadInput(val) {
    if (val === '=') {
      calculateResult();
    } else {
      if (expression === '' && ['+', '*', '/'].includes(val)) return;
      expression += val;
      amountDisplay.textContent = expression || '0';
    }
  }

  function calculateResult() {
    var result = safeEvaluate(expression);
    expression = String(result);
    amountDisplay.textContent = expression;
  }

  function safeEvaluate(expr) {
    if (!expr) return 0;
    var sanitized = String(expr).replace(/[^0-9+\-*/.]/g, '');
    if (!sanitized) return 0;

    try {
      var tokens = sanitized.match(/(\d+\.?\d*|[\+\-\*/])/g);
      if (!tokens) return 0;

      var pass1 = [];
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token === '*' || token === '/') {
          var prev = parseFloat(pass1.pop());
          var next = parseFloat(tokens[++i]);
          if (isNaN(next)) break;
          var res = token === '*' ? prev * next : (next !== 0 ? prev / next : 0);
          pass1.push(res.toString());
        } else {
          pass1.push(token);
        }
      }

      var total = parseFloat(pass1[0]) || 0;
      for (var j = 1; j < pass1.length; j += 2) {
        var op = pass1[j];
        var nxt = parseFloat(pass1[j + 1]);
        if (isNaN(nxt)) break;
        if (op === '+') total += nxt;
        if (op === '-') total -= nxt;
      }

      return isFinite(total) ? Math.round(total * 100) / 100 : 0;
    } catch (e) {
      return 0;
    }
  }

  function fetchCategories(type, callback) {
    fetch('/api/categories?type=' + type)
      .then(function (res) { return res.json(); })
      .then(function (categories) {
        populateCategories(categories);
        if (callback) callback();
      })
      .catch(function () {
        var defaults = type === 'expense'
          ? [{ name: 'อาหารและเครื่องดื่ม' }, { name: 'ยานยนต์' }, { name: 'ของใช้ในบ้าน' }]
          : [{ name: 'รายได้' }, { name: 'โบนัส' }];
        populateCategories(defaults);
        if (callback) callback();
      });
  }

  function populateCategories(categories) {
    categorySelect.innerHTML = '<option value="" disabled selected>เลือกหมวดหมู่</option>';
    categories.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });

    var addOpt = document.createElement('option');
    addOpt.value = '__ADD_NEW__';
    addOpt.textContent = '+ เพิ่มหมวดหมู่ใหม่...';
    categorySelect.appendChild(addOpt);
  }

  categorySelect.addEventListener('change', function (e) {
    if (e.target.value === '__ADD_NEW__') openMiniModal();
  });

  function openMiniModal() {
    miniModalOverlay.classList.remove('hidden');
    newCategoryInput.value = '';
    newCategoryInput.focus();
  }

  function closeMiniModal() {
    miniModalOverlay.classList.add('hidden');
    categorySelect.value = '';
  }

  cancelCategoryBtn.addEventListener('click', closeMiniModal);
  saveCategoryBtn.addEventListener('click', function () {
    var name = newCategoryInput.value.trim();
    if (!name) return alert('กรุณากรอกชื่อหมวดหมู่');

    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, type: modalType })
    }).finally(function () {
      fetchCategories(modalType);
      closeMiniModal();
    });
  });

  cameraBtn.addEventListener('click', function () { receiptInput.click(); });
  receiptInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (file) {
      selectedImageFile = file;
      imagePreview.src = URL.createObjectURL(file);
      imagePreviewContainer.classList.remove('hidden');
    }
  });

  removeImageBtn.addEventListener('click', function () {
    selectedImageFile = null;
    receiptInput.value = '';
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
  });

  detailCameraBtn.addEventListener('click', function () { detailReceiptInput.click(); });
  detailReceiptInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (file) {
      selectedImageFile = file;
      detailImagePreview.src = URL.createObjectURL(file);
      detailImagePreview.classList.remove('hidden');
      noImageText.classList.add('hidden');
    }
  });

  function resetForm() {
    expression = '';
    amountDisplay.textContent = '0';
    noteInput.value = '';
    categorySelect.value = '';
    selectedImageFile = null;
    receiptInput.value = '';
    detailReceiptInput.value = '';
    imagePreview.src = '';
    detailImagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
    detailImagePreview.classList.add('hidden');
    noImageText.classList.remove('hidden');
    selectedDate = new Date();
  }

  function submitTransaction() {
    if (modalViewMode === 'edit_amount') {
      exitEditAmountMode();
    }

    var finalAmount = safeEvaluate(expression);
    var category = categorySelect.value;
    var note = noteInput.value.trim();

    if (!category || category === '__ADD_NEW__') {
      return alert('กรุณาเลือกหมวดหมู่');
    }
    if (finalAmount <= 0) {
      return alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
    }

    var formData = new FormData();
    formData.append('type', modalType);
    formData.append('date', selectedDate.toISOString());
    formData.append('amount', finalAmount);
    formData.append('category', category);
    formData.append('note', note);
    if (selectedImageFile) {
      formData.append('image', selectedImageFile);
    }

    var url = editingTransactionId ? ('/api/transactions/' + editingTransactionId) : '/api/transactions';
    var method = editingTransactionId ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      body: formData
    })
    .then(function (res) {
      if (res.ok) {
        closeModal();
        loadDataAndRender();
      } else {
        alert('บันทึกไม่สำเร็จ');
      }
    })
    .catch(function (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Server');
      console.error(err);
    });
  }

  /* ---------------------------------------------------------
   * Init
   * ------------------------------------------------------- */
  monthTrigger.textContent = MONTHS[state.monthIndex];
  yearTrigger.textContent = state.year;
  loadDataAndRender();
})();