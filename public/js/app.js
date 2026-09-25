(function () {
  "use strict";

  /* ---------------------------------------------------------
   * Mock data (Phase 1 frontend demo — will be replaced by
   * data fetched from the /api/transactions/summary endpoint
   * once the backend is wired up). Each leaf item carries a
   * "type" of "expense" or "income" used for mode filtering.
   * ------------------------------------------------------- */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MIN_YEAR = 2020;
  var CURRENT_YEAR = new Date().getFullYear();
  var MAX_YEAR = Math.max(CURRENT_YEAR, 2026);

  var DATA = {
    "2026-8": [
      {
        date: "29 Sep 2026",
        groups: [
          {
            name: "อาหารและเครื่องดื่ม",
            items: [
              { name: "อาหารเย็น", amount: 50, type: "expense" },
              { name: "อาหารเที่ยง", amount: 50, type: "expense" }
            ]
          },
          {
            name: "ยานยนต์",
            items: [
              { name: "ค่าน้ำมัน", amount: 100, type: "expense" }
            ]
          }
        ]
      },
      {
        date: "28 Sep 2026",
        groups: [
          {
            name: "อาหารและเครื่องดื่ม",
            items: [
              { name: "อาหารเย็น", amount: 50, type: "expense" },
              { name: "อาหารเที่ยง", amount: 50, type: "expense" }
            ]
          }
        ]
      },
      {
        date: "1 Sep 2026",
        groups: [
          {
            name: "รายได้",
            items: [
              { name: "เงินเดือน", amount: 15000, type: "income" }
            ]
          }
        ]
      }
    ]
  };

  var state = {
    year: 2026,
    monthIndex: 8,
    mode: "expense",
    yearListBuilt: false,
    monthListBuilt: false
  };

  /* ---------------------------------------------------------
   * Element references
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

  /* ---------------------------------------------------------
   * Sidebar menu open / close
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
   * Generic popover helper (year / month pickers)
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
          render();
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
        render();
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
   * Pocket badge — 3D flip + mode switching
   * ------------------------------------------------------- */
  pocketBadge.addEventListener("click", function () {
    state.mode = state.mode === "expense" ? "income" : "expense";
    pocketBadge.setAttribute("aria-pressed", state.mode === "income" ? "true" : "false");
    renderDayList();
  });

  /* ---------------------------------------------------------
   * Rendering helpers
   * ------------------------------------------------------- */
  function formatAmount(value) {
    return Number(value).toLocaleString("en-US");
  }

  function getMonthData() {
    var key = state.year + "-" + state.monthIndex;
    return DATA[key] || [];
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
          totals[item.type] += item.amount;
        });
      });
    });

    return totals;
  }

  function updateBadgeAmounts() {
    var totals = computeMonthTotals(getMonthData());
    expenseAmountEl.textContent = formatAmount(totals.expense);
    incomeAmountEl.textContent = formatAmount(totals.income);
  }

  function buildSubitems(items) {
    var ul = document.createElement("ul");
    ul.className = "tx-subitems";

    items.forEach(function (item) {
      var li = document.createElement("li");

      var name = document.createElement("span");
      name.className = "tx-subitem-name";
      name.textContent = item.name;

      var amount = document.createElement("span");
      amount.className = "tx-subitem-amount";
      amount.textContent = formatAmount(item.amount);

      li.appendChild(name);
      li.appendChild(amount);
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

    var days = filterDaysByMode(getMonthData(), state.mode);

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
   * Floating action button (placeholder for Phase 1)
   * ------------------------------------------------------- */
  fabAdd.addEventListener("click", function () {
    window.alert("ฟอร์มเพิ่มรายการจะเปิดใช้งานในขั้นตอนถัดไป");
  });

  /* ---------------------------------------------------------
   * Init
   * ------------------------------------------------------- */
  render();
})();
