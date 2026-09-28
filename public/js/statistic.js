(function () {
  "use strict";

  // Palette สีสำหรับ Top 4 หมวดหมู่ และ ซีก "อื่นๆ"
  var TOP_COLORS = ["#2563eb", "#059669", "#d97706", "#9333ea"];
  var OTHERS_COLOR = "#888888";

  /* ---------------------------------------------------------
   * Element References
   * ------------------------------------------------------- */
  var statMonthBtn = document.getElementById("statMonthBtn");
  var statYearBtn = document.getElementById("statYearBtn");
  var statChartTitle = document.getElementById("statChartTitle");
  var statChartSubtitle = document.getElementById("statChartSubtitle");
  var statChartContainer = document.getElementById("statChartContainer");
  var statLegendContainer = document.getElementById("statLegendContainer");

  /* ---------------------------------------------------------
   * Time Filtering Listeners
   * ------------------------------------------------------- */
  if (statMonthBtn) {
    statMonthBtn.addEventListener("click", function () {
      if (window.MyPocketApp.statisticTimeMode === "month") return;
      window.MyPocketApp.statisticTimeMode = "month";
      statMonthBtn.classList.add("active");
      statYearBtn.classList.remove("active");
      window.MyPocketApp.loadDataAndRender();
    });
  }

  if (statYearBtn) {
    statYearBtn.addEventListener("click", function () {
      if (window.MyPocketApp.statisticTimeMode === "year") return;
      window.MyPocketApp.statisticTimeMode = "year";
      statYearBtn.classList.add("active");
      statMonthBtn.classList.remove("active");
      window.MyPocketApp.loadDataAndRender();
    });
  }

  /* ---------------------------------------------------------
   * Data Aggregation Logic
   * ------------------------------------------------------- */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getFilteredRawTransactions() {
    var state = window.MyPocketApp.state;
    var raw = state.rawTransactions || [];
    var isYearMode = (window.MyPocketApp.statisticTimeMode === "year");

    return raw.filter(function (tx) {
      var d = window.MyPocketApp.parseDbDate(tx.date);
      if (d.getFullYear() !== state.year) return false;
      if (!isYearMode && d.getMonth() !== state.monthIndex) return false;
      return true;
    });
  }

  function calculateSlices() {
    var mode = window.MyPocketApp.state.mode; // "expense", "income", "net"
    var txList = getFilteredRawTransactions();

    if (mode === "net") {
      var totalExp = 0;
      var totalInc = 0;

      txList.forEach(function (tx) {
        var amt = Number(tx.amount) || 0;
        if (tx.type === "expense") totalExp += amt;
        if (tx.type === "income") totalInc += amt;
      });

      var totalNet = totalExp + totalInc;
      var slices = [];

      if (totalExp > 0) {
        slices.push({
          name: "รายจ่าย",
          amount: totalExp,
          color: "var(--maroon)",
          type: "expense"
        });
      }

      if (totalInc > 0) {
        slices.push({
          name: "รายรับ",
          amount: totalInc,
          color: "var(--green-header)",
          type: "income"
        });
      }

      return { slices: slices, total: totalNet };
    } else {
      // โหมด Expense หรือ Income
      var catMap = {};
      var modeTotal = 0;

      txList.forEach(function (tx) {
        if (tx.type !== mode) return;
        var cat = tx.category || "อื่นๆ";
        var amt = Number(tx.amount) || 0;
        catMap[cat] = (catMap[cat] || 0) + amt;
        modeTotal += amt;
      });

      var sortedCats = Object.keys(catMap).map(function (cat) {
        return { name: cat, amount: catMap[cat] };
      }).sort(function (a, b) {
        return b.amount - a.amount;
      });

      var slices = [];

      if (sortedCats.length <= 4) {
        sortedCats.forEach(function (item, idx) {
          slices.push({
            name: item.name,
            amount: item.amount,
            color: TOP_COLORS[idx % TOP_COLORS.length]
          });
        });
      } else {
        // Top 4
        for (var i = 0; i < 4; i++) {
          slices.push({
            name: sortedCats[i].name,
            amount: sortedCats[i].amount,
            color: TOP_COLORS[i]
          });
        }
        // รวมซีกที่ 5 "อื่นๆ"
        var othersSum = 0;
        for (var j = 4; j < sortedCats.length; j++) {
          othersSum += sortedCats[j].amount;
        }
        if (othersSum > 0) {
          slices.push({
            name: "อื่นๆ",
            amount: othersSum,
            color: OTHERS_COLOR
          });
        }
      }

      return { slices: slices, total: modeTotal };
    }
  }

  /* ---------------------------------------------------------
   * SVG Pie Chart & Callout Lines Rendering
   * ------------------------------------------------------- */
  function drawPieChart(slices, totalAmount) {
    if (!statChartContainer) return;

    if (!slices || slices.length === 0 || totalAmount <= 0) {
      statChartContainer.innerHTML = '<div style="color: #666; font-weight: 700; padding: 40px 0;">ไม่มีข้อมูลรายการในช่วงเวลานี้</div>';
      return;
    }

    var svgWidth = 540;
    var svgHeight = 360;
    var cx = 270;
    var cy = 180;
    var R = 118; // ขยายขนาดรัศมีกราฟวงกลมจาก 90 เป็น 118

    var currentAngle = -Math.PI / 2; // เริ่มวาดที่ 12 นาฬิกา
    var pathsHtml = '';
    var linesHtml = '';
    var labelsHtml = '';

    var labelItems = [];

    slices.forEach(function (slice, index) {
      var ratio = slice.amount / totalAmount;
      var sliceAngle = ratio * 2 * Math.PI;
      var startAngle = currentAngle;
      var endAngle = currentAngle + sliceAngle;
      var midAngle = startAngle + sliceAngle / 2;
      currentAngle = endAngle;

      var pct = ratio * 100;

      // 1. คำนวณ SVG Path กราฟวงกลม
      var x1 = cx + R * Math.cos(startAngle);
      var y1 = cy + R * Math.sin(startAngle);
      var x2 = cx + R * Math.cos(endAngle);
      var y2 = cy + R * Math.sin(endAngle);

      var largeArc = sliceAngle > Math.PI ? 1 : 0;
      var d = '';

      if (ratio >= 0.9999) {
        d = 'M ' + (cx - R) + ' ' + cy +
            ' A ' + R + ' ' + R + ' 0 1 0 ' + (cx + R) + ' ' + cy +
            ' A ' + R + ' ' + R + ' 0 1 0 ' + (cx - R) + ' ' + cy;
      } else {
        d = 'M ' + cx + ' ' + cy +
            ' L ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
            ' A ' + R + ' ' + R + ' 0 ' + largeArc + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) +
            ' Z';
      }

      var dataAttrs = 'data-slice-type="' + (slice.type || '') + '" data-index="' + index + '"';
      pathsHtml += '<path d="' + d + '" fill="' + slice.color + '" class="pie-slice" ' + dataAttrs + '></path>';

      // 2. คำนวณพิกัดเส้นชี้หักศอก (Callout Lines)
      var xStart = cx + (R * 0.82) * Math.cos(midAngle);
      var yStart = cy + (R * 0.82) * Math.sin(midAngle);

      var Rout = R + 24;
      var xElbow = cx + Rout * Math.cos(midAngle);
      var yElbow = cy + Rout * Math.sin(midAngle);

      var isRight = Math.cos(midAngle) >= 0;
      var xEnd = isRight ? (xElbow + 28) : (xElbow - 28);
      var textAnchor = isRight ? 'start' : 'end';
      var textX = isRight ? (xEnd + 6) : (xEnd - 6);

      labelItems.push({
        index: index,
        name: slice.name,
        amount: slice.amount,
        pct: pct,
        type: slice.type,
        color: slice.color,
        isRight: isRight,
        xStart: xStart,
        yStart: yStart,
        xElbow: xElbow,
        yElbow: yElbow,
        xEnd: xEnd,
        textAnchor: textAnchor,
        textX: textX,
        dataAttrs: dataAttrs
      });
    });

    // ป้องกันเส้นและข้อความซ้อนทับกันในฝั่งเดียวกัน
    ['left', 'right'].forEach(function (side) {
      var sideItems = labelItems.filter(function (item) {
        return side === 'right' ? item.isRight : !item.isRight;
      });

      sideItems.sort(function (a, b) { return a.yElbow - b.yElbow; });

      var minGap = 28;
      for (var i = 1; i < sideItems.length; i++) {
        var prev = sideItems[i - 1];
        var curr = sideItems[i];
        if (curr.yElbow - prev.yElbow < minGap) {
          curr.yElbow = prev.yElbow + minGap;
        }
      }
    });

    // วาด Polyline และ Label
    labelItems.forEach(function (item) {
      var points = item.xStart.toFixed(1) + ',' + item.yStart.toFixed(1) + ' ' +
                   item.xElbow.toFixed(1) + ',' + item.yElbow.toFixed(1) + ' ' +
                   item.xEnd.toFixed(1) + ',' + item.yElbow.toFixed(1);

      linesHtml += '<polyline points="' + points + '" class="callout-line"></polyline>';

      var formattedAmt = window.MyPocketApp.formatAmount ? window.MyPocketApp.formatAmount(item.amount) : item.amount;

      labelsHtml += '<g class="callout-label" ' + item.dataAttrs + '>';
      labelsHtml += '<text x="' + item.textX.toFixed(1) + '" y="' + item.yElbow.toFixed(1) + '" text-anchor="' + item.textAnchor + '">';
      labelsHtml += '<tspan x="' + item.textX.toFixed(1) + '" dy="-5" class="callout-label-name">' + escapeHtml(item.name) + '</tspan>';
      labelsHtml += '<tspan x="' + item.textX.toFixed(1) + '" dy="16" class="callout-label-val">' + formattedAmt + ' (' + item.pct.toFixed(1) + '%)</tspan>';
      labelsHtml += '</text></g>';
    });

    var svgHtml = '<svg viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" class="stat-chart-svg">' +
                  '<g class="slices-group">' + pathsHtml + '</g>' +
                  '<g class="lines-group">' + linesHtml + '</g>' +
                  '<g class="labels-group">' + labelsHtml + '</g>' +
                  '</svg>';

    statChartContainer.innerHTML = svgHtml;
    bindChartInteractions();
  }

  function renderLegend(slices, totalAmount) {
    if (!statLegendContainer) return;

    if (!slices || slices.length === 0 || totalAmount <= 0) {
      statLegendContainer.innerHTML = '';
      return;
    }

    var html = '';
    slices.forEach(function (slice) {
      var pct = ((slice.amount / totalAmount) * 100).toFixed(1);
      var formattedAmt = window.MyPocketApp.formatAmount ? window.MyPocketApp.formatAmount(slice.amount) : slice.amount;
      var sliceType = slice.type || '';

      html += '<div class="legend-item" data-slice-type="' + sliceType + '">';
      html += '<div class="legend-left">';
      html += '<span class="legend-color-dot" style="background-color: ' + slice.color + ';"></span>';
      html += '<span class="legend-name">' + escapeHtml(slice.name) + '</span>';
      html += '</div>';
      html += '<div class="legend-right">';
      html += '<span class="legend-amount">' + formattedAmt + '</span>';
      html += '<span class="legend-percent">' + pct + '%</span>';
      html += '</div>';
      html += '</div>';
    });

    statLegendContainer.innerHTML = html;

    statLegendContainer.querySelectorAll('.legend-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var sliceType = item.getAttribute('data-slice-type');
        handleSliceClick(sliceType);
      });
    });
  }

  function handleSliceClick(sliceType) {
    if (window.MyPocketApp.state.mode === 'net' && (sliceType === 'expense' || sliceType === 'income')) {
      window.MyPocketApp.state.mode = sliceType;
      var pocketBadge = document.getElementById("pocketBadge");
      if (pocketBadge) {
        pocketBadge.setAttribute("data-mode", sliceType);
      }
      window.MyPocketApp.loadDataAndRender();
    }
  }

  function bindChartInteractions() {
    if (!statChartContainer) return;

    statChartContainer.querySelectorAll('.pie-slice, .callout-label').forEach(function (el) {
      el.addEventListener('click', function () {
        var sliceType = el.getAttribute('data-slice-type');
        handleSliceClick(sliceType);
      });
    });
  }

  /* ---------------------------------------------------------
   * Main Render Pipeline
   * ------------------------------------------------------- */
  function renderStatistic() {
    var state = window.MyPocketApp.state;
    var isYearMode = (window.MyPocketApp.statisticTimeMode === "year");

    // อัปเดตหัวข้อการ์ดตามโหมดเวลา
    if (statChartTitle) {
      if (state.mode === "expense") statChartTitle.textContent = "สถิติรายจ่าย";
      else if (state.mode === "income") statChartTitle.textContent = "สถิติรายรับ";
      else statChartTitle.textContent = "สถิติภาพรวมสุทธิ (Net)";
    }

    if (statChartSubtitle) {
      if (isYearMode) {
        statChartSubtitle.textContent = "ประจำปี " + state.year;
      } else {
        var monthName = window.MyPocketApp.MONTHS[state.monthIndex];
        statChartSubtitle.textContent = "ประจำเดือน " + monthName + " " + state.year;
      }
    }

    var result = calculateSlices();
    drawPieChart(result.slices, result.total);
    renderLegend(result.slices, result.total);
  }

  // ลงทะเบียน Callback ให้ `app.js` เรียกใช้เมื่อมีการเปลี่ยนแปลงข้อมูล/โหมด
  window.MyPocketApp.onStatisticRender = renderStatistic;
})();