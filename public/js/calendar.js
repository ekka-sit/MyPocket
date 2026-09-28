(function () {
  "use strict";

  var calendarView = document.getElementById("calendarView");
  var calendarDailyModalOverlay = document.getElementById("calendarDailyModalOverlay");
  var closeCalendarDailyModalBtn = document.getElementById("closeCalendarDailyModalBtn");
  var calendarDailyDateText = document.getElementById("calendarDailyDateText");
  var calendarDailyBody = document.getElementById("calendarDailyBody");

  if (!calendarView) return;

  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year, monthIndex) {
    return new Date(year, monthIndex, 1).getDay();
  }

  function calculateDailyTotal(dayItems, mode) {
    if (!dayItems || dayItems.length === 0) return 0;

    if (mode === "expense") {
      return dayItems
        .filter(function (i) { return i.type === "expense"; })
        .reduce(function (sum, i) { return sum + i.amount; }, 0);
    }

    if (mode === "income") {
      return dayItems
        .filter(function (i) { return i.type === "income"; })
        .reduce(function (sum, i) { return sum + i.amount; }, 0);
    }

    // Net Income mode (Income - Expense)
    var inc = dayItems
      .filter(function (i) { return i.type === "income"; })
      .reduce(function (sum, i) { return sum + i.amount; }, 0);

    var exp = dayItems
      .filter(function (i) { return i.type === "expense"; })
      .reduce(function (sum, i) { return sum + i.amount; }, 0);

    return inc - exp;
  }

  function getDailyItemsForDate(dayNum, year, monthIndex, currentDaysData) {
    var targetDateStr = dayNum + " " + window.MyPocketApp.MONTHS[monthIndex] + " " + year;
    
    var dayData = currentDaysData.find(function (d) {
      return d.date === targetDateStr;
    });

    if (!dayData) return [];

    var allItems = [];
    dayData.groups.forEach(function (g) {
      g.items.forEach(function (item) {
        allItems.push(item);
      });
    });

    return allItems;
  }

  function renderCalendar() {
    var app = window.MyPocketApp;
    if (!app || !app.state) return;

    var state = app.state;
    if (state.currentPage !== "calendar") return;

    calendarView.className = "calendar-view calendar-theme-" + state.mode;
    calendarView.innerHTML = "";

    // Header แถววัน (Sun - Sat)
    var headerRow = document.createElement("div");
    headerRow.className = "calendar-header-row";

    DAY_NAMES.forEach(function (day) {
      var nameEl = document.createElement("div");
      nameEl.className = "calendar-day-name";
      nameEl.textContent = day;
      headerRow.appendChild(nameEl);
    });

    calendarView.appendChild(headerRow);

    // ตารางวันที่ Grid
    var grid = document.createElement("div");
    grid.className = "calendar-grid";

    var daysInMonth = getDaysInMonth(state.year, state.monthIndex);
    var firstDayIdx = getFirstDayOfWeek(state.year, state.monthIndex);

    // วันของเดือนก่อนหน้า (Previous Month)
    var prevMonthIndex = state.monthIndex === 0 ? 11 : state.monthIndex - 1;
    var prevYear = state.monthIndex === 0 ? state.year - 1 : state.year;
    var prevDaysInMonth = getDaysInMonth(prevYear, prevMonthIndex);
    var startPrevDay = prevDaysInMonth - firstDayIdx + 1;

    for (var pDay = startPrevDay; pDay <= prevDaysInMonth; pDay++) {
      var prevCell = document.createElement("div");
      prevCell.className = "calendar-cell other-month";

      var prevDateNum = document.createElement("span");
      prevDateNum.className = "calendar-date-num";
      prevDateNum.textContent = pDay;

      prevCell.appendChild(prevDateNum);
      grid.appendChild(prevCell);
    }

    // วาดวันที่ 1 ถึง วันสุดท้ายของเดือนปัจจุบัน
    for (var day = 1; day <= daysInMonth; day++) {
      (function (dayNum) {
        var cell = document.createElement("div");
        cell.className = "calendar-cell";

        var dateNum = document.createElement("span");
        dateNum.className = "calendar-date-num";
        dateNum.textContent = dayNum;

        var items = getDailyItemsForDate(dayNum, state.year, state.monthIndex, state.currentDaysData);
        var total = calculateDailyTotal(items, state.mode);

        var totalEl = document.createElement("span");
        totalEl.className = "calendar-daily-total";

        // เงื่อนไขการแสดงผลสีและเครื่องหมาย
        if (state.mode === "expense") {
          if (total > 0) {
            totalEl.textContent = app.formatAmount(total);
            totalEl.classList.add("cal-amount-expense");
          } else {
            totalEl.textContent = "0";
            totalEl.classList.add("cal-amount-zero");
          }
        } else if (state.mode === "income") {
          if (total > 0) {
            totalEl.textContent = app.formatAmount(total);
            totalEl.classList.add("cal-amount-income");
          } else {
            totalEl.textContent = "0";
            totalEl.classList.add("cal-amount-zero");
          }
        } else if (state.mode === "net") {
          if (total > 0) {
            totalEl.textContent = "+" + app.formatAmount(total);
            totalEl.classList.add("cal-amount-pos");
          } else if (total < 0) {
            totalEl.textContent = "-" + app.formatAmount(Math.abs(total));
            totalEl.classList.add("cal-amount-neg");
          } else {
            totalEl.textContent = "0";
            totalEl.classList.add("cal-amount-zero");
          }
        }

        cell.appendChild(dateNum);
        cell.appendChild(totalEl);

        // คลิกช่องวันที่เพื่อเปิด Modal รายละเอียด
        cell.addEventListener("click", function () {
          openCalendarDailyModal(dayNum, state.year, state.monthIndex, items, state.mode);
        });

        grid.appendChild(cell);
      })(day);
    }

    // วันของเดือนถัดไป (Next Month)
    var totalCells = firstDayIdx + daysInMonth;
    var remainingCells = (7 - (totalCells % 7)) % 7;

    for (var nDay = 1; nDay <= remainingCells; nDay++) {
      var nextCell = document.createElement("div");
      nextCell.className = "calendar-cell other-month";

      var nextDateNum = document.createElement("span");
      nextDateNum.className = "calendar-date-num";
      nextDateNum.textContent = nDay;

      nextCell.appendChild(nextDateNum);
      grid.appendChild(nextCell);
    }

    calendarView.appendChild(grid);
  }

  function openCalendarDailyModal(dayNum, year, monthIndex, items, mode) {
    var app = window.MyPocketApp;
    var dayStr = String(dayNum).padStart(2, '0');
    var monthStr = app.MONTHS[monthIndex];
    calendarDailyDateText.textContent = dayStr + " / " + monthStr + " / " + year;

    // อัปเดต Class เพื่อให้สีกรอบ Modal และปุ่มปิดเปลี่ยนตามโหมด
    var calendarDailyModal = document.getElementById("calendarDailyModal");
    if (calendarDailyModal) {
      calendarDailyModal.className = "modal-card modal-calendar-daily modal-daily-" + (mode || "net");
    }

    calendarDailyBody.innerHTML = "";

    // กรองรายการตามโหมดที่เลือกอยู่
    var filteredItems = items.filter(function (item) {
      if (mode === "expense") return item.type === "expense";
      if (mode === "income") return item.type === "income";
      return true; // net mode แสดงทั้งคู่
    });

    if (filteredItems.length === 0) {
      var emptyText = document.createElement("p");
      emptyText.className = "text-center text-muted py-4";
      emptyText.textContent = "ไม่มีรายการสำหรับวันนี้";
      calendarDailyBody.appendChild(emptyText);
    } else {
      // จัดกลุ่มตามหมวดหมู่
      var categoryMap = {};
      filteredItems.forEach(function (item) {
        var cat = item.category || "อื่นๆ";
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(item);
      });

      Object.keys(categoryMap).forEach(function (catName) {
        var groupItems = categoryMap[catName];
        var groupTotal = groupItems.reduce(function (sum, i) {
          return i.type === "expense" ? sum - i.amount : sum + i.amount;
        }, 0);

        var groupWrap = document.createElement("div");
        groupWrap.className = "tx-group";

        var header = document.createElement("div");
        header.className = "tx-group-header";

        var nameSpan = document.createElement("span");
        nameSpan.textContent = catName;

        var totalSpan = document.createElement("span");
        if (mode === "net") {
          totalSpan.textContent = (groupTotal >= 0 ? "+" : "") + app.formatAmount(groupTotal);
        } else {
          totalSpan.textContent = app.formatAmount(Math.abs(groupTotal));
        }

        header.appendChild(nameSpan);
        header.appendChild(totalSpan);
        groupWrap.appendChild(header);

        // Subitems (Tree view)
        var ul = document.createElement("ul");
        ul.className = "tx-subitems";

        groupItems.forEach(function (item) {
          var li = document.createElement("li");

          var itemName = document.createElement("span");
          itemName.className = "tx-subitem-name";
          itemName.textContent = item.name;

          var itemAmount = document.createElement("span");
          itemAmount.className = "tx-subitem-amount";

          if (mode === "net") {
            itemAmount.textContent = (item.type === "expense" ? "-" : "+") + app.formatAmount(item.amount);
            itemAmount.style.color = item.type === "expense" ? "var(--maroon)" : "var(--green-header)";
          } else {
            itemAmount.textContent = app.formatAmount(item.amount);
          }

          li.appendChild(itemName);
          li.appendChild(itemAmount);
          ul.appendChild(li);
        });

        groupWrap.appendChild(ul);
        calendarDailyBody.appendChild(groupWrap);
      });
    }

    calendarDailyModalOverlay.classList.remove("hidden");
  }

  function closeCalendarDailyModal() {
    calendarDailyModalOverlay.classList.add("hidden");
  }

  if (closeCalendarDailyModalBtn) {
    closeCalendarDailyModalBtn.addEventListener("click", closeCalendarDailyModal);
  }

  calendarDailyModalOverlay.addEventListener("click", function (e) {
    if (e.target === calendarDailyModalOverlay) {
      closeCalendarDailyModal();
    }
  });

  // ผูกฟังก์ชัน renderCalendar เข้ากับ App หลัก
  if (window.MyPocketApp) {
    window.MyPocketApp.onRender = renderCalendar;
  }
})();