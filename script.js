/****************** 工具函数：颜色解析与转换  ******************/

/**
 * 通用函数：解析字符串（HEX / RGB / HSL）转为 [r,g,b] (0~255)
 */
function parseColor(colorStr) {
  colorStr = colorStr.trim().toLowerCase();

  // 1. 检查 #hex
  if (colorStr.startsWith("#")) {
    return hexToRgb(colorStr);
  }

  // 2. 检查 rgb(...)
  if (colorStr.startsWith("rgb")) {
    return rgbStringToRgb(colorStr);
  }

  // 3. 检查 hsl(...)
  if (colorStr.startsWith("hsl")) {
    return hslStringToRgb(colorStr);
  }

  // 4. 若可能是没#的hex
  if (/^[0-9a-f]{3,6}$/.test(colorStr)) {
    return hexToRgb("#" + colorStr);
  }

  // 否则返回 null
  return null;
}

function hexToRgb(hex) {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex =
      cleanHex[0] +
      cleanHex[0] +
      cleanHex[1] +
      cleanHex[1] +
      cleanHex[2] +
      cleanHex[2];
  }
  if (!/^[0-9a-f]{6}$/.test(cleanHex)) return null;
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbStringToRgb(str) {
  const match = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (!match) return null;
  return [
    Math.min(255, parseInt(match[1], 10)),
    Math.min(255, parseInt(match[2], 10)),
    Math.min(255, parseInt(match[3], 10))
  ];
}

function hslStringToRgb(str) {
  const match = str.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
  if (!match) return null;
  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  return hslToRgb(h, s, l);
}

/** [r,g,b] -> HEX */
function rgbToHex([r, g, b]) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

/** [r,g,b] -> [h,s,l] (0<=h<360, 0<=s,l<=100) */
function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h = h * 60;
  }
  return [Math.round(h), +(s * 100).toFixed(1), +(l * 100).toFixed(1)];
}

/** hsl -> [r,g,b] */
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return [r, g, b];
}

/****************** 基础模式：多种方案生成（去重） ******************/

function generateBasicScheme(scheme, baseRgb) {
  const [h, s, l] = rgbToHsl(...baseRgb);

  // 用来收集结果
  const results = [];
  const colorSet = new Set();

  // 辅助函数：只添加不重复的颜色
  function addColor(rgb) {
    const key = rgb.join(",");
    if (!colorSet.has(key)) {
      colorSet.add(key);
      results.push(rgb);
    }
  }

  // 先把主色加入
  addColor(baseRgb);

  switch (scheme) {
    case "complementary":
      // 互补色
      addColor(hslToRgb((h + 180) % 360, s, l));
      break;

    case "analogous":
      // 相邻色：-30, +30
      addColor(hslToRgb((h + 330) % 360, s, l));
      addColor(hslToRgb((h + 30) % 360, s, l));
      break;

    case "triadic":
      // 三分色：+120, +240
      addColor(hslToRgb((h + 120) % 360, s, l));
      addColor(hslToRgb((h + 240) % 360, s, l));
      break;

    case "tetradic":
      // 四分色：+90, +180, +270
      addColor(hslToRgb((h + 90) % 360, s, l));
      addColor(hslToRgb((h + 180) % 360, s, l));
      addColor(hslToRgb((h + 270) % 360, s, l));
      break;

    case "monochromatic":
      // 单色：可做多个明度变化
      const deltaArr = [-20, -10, 10, 20];
      deltaArr.forEach((d) => {
        let newL = l + d;
        if (newL < 0) newL = 0;
        if (newL > 100) newL = 100;
        addColor(hslToRgb(h, s, newL));
      });
      break;

    default:
      // 未知时默认三分色
      addColor(hslToRgb((h + 120) % 360, s, l));
      addColor(hslToRgb((h + 240) % 360, s, l));
      break;
  }

  return results;
}

/****************** 高级模式：根据色相、饱和度、明度范围生成（去重） ******************/

function generateAdvancedPalette(baseRgb, hueRange, satMin, satMax, lightMin, lightMax) {
  const [baseH] = rgbToHsl(...baseRgb);

  const step = 10;  // 可调
  const hMin = baseH - hueRange;
  const hMax = baseH + hueRange;

  const colorSet = new Set();
  const colors = [];

  for (let h = hMin; h <= hMax; h += step) {
    const hh = (h + 360) % 360; // 归一化到0-359
    for (let ss = satMin; ss <= satMax; ss += 20) {
      for (let ll = lightMin; ll <= lightMax; ll += 20) {
        const rgbColor = hslToRgb(hh, ss, ll);

        // 用字符串key来判断是否已存在
        const key = rgbColor.join(",");
        if (!colorSet.has(key)) {
          colorSet.add(key);
          colors.push(rgbColor);
        }
      }
    }
  }

  return colors; // 无重复的 [r,g,b] 数组
}

/****************** 渲染色块 ******************/
function renderPalette(colors) {
  const container = document.getElementById("paletteContainer");
  // 先移除内容 & 动画类
  container.innerHTML = "";
  container.classList.remove("animate-in");

  if (!colors.length) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "没有生成任何颜色。";
    emptyMsg.style.color = "#777";
    container.appendChild(emptyMsg);
    return;
  }

  colors.forEach((c) => {
    const card = document.createElement("div");
    card.className = "color-card";
    card.style.backgroundColor = rgbToHex(c);

    const info = document.createElement("div");
    info.className = "color-info";
    info.textContent = rgbToHex(c).toUpperCase();

    card.appendChild(info);
    container.appendChild(card);
  });

  // 触发淡入动画
  setTimeout(() => {
    container.classList.add("animate-in");
  }, 50);
}

/****************** 主逻辑：模式切换与事件绑定 ******************/
document.addEventListener("DOMContentLoaded", () => {
  // 模式导航栏 <li> DOM
  const basicModeNavItem = document.getElementById("basicModeNavItem");
  const advancedModeNavItem = document.getElementById("advancedModeNavItem");

  // 模式切换区域
  const modeWrapper = document.querySelector(".mode-wrapper");

  // 基础模式容器
  const basicModeContainer = document.getElementById("basicModeContainer");
  // 高级模式容器
  const advancedModeContainer = document.getElementById("advancedModeContainer");

  // 基础模式
  const colorTextBasic = document.getElementById("colorTextBasic");
  const colorPickerBasic = document.getElementById("colorPickerBasic");
  const schemeSelect = document.getElementById("schemeSelect");
  const generateBtnBasic = document.getElementById("generateBtnBasic");

  // 高级模式
  const colorTextAdvanced = document.getElementById("colorTextAdvanced");
  const colorPickerAdvanced = document.getElementById("colorPickerAdvanced");
  const hueRange = document.getElementById("hueRange");
  const hueValue = document.getElementById("hueValue");
  const satMin = document.getElementById("satMin");
  const satMax = document.getElementById("satMax");
  const satValue = document.getElementById("satValue");
  const lightMin = document.getElementById("lightMin");
  const lightMax = document.getElementById("lightMax");
  const lightValue = document.getElementById("lightValue");
  const generateBtnAdvanced = document.getElementById("generateBtnAdvanced");

  const paletteContainer = document.getElementById("paletteContainer");

  // 当前模式
  let currentMode = "basic";

  // 模式切换函数
  function switchToMode(mode) {
    if (mode === currentMode) return; // 如果是当前模式，什么都不做

    // 定义滑动方向
    let translateXPercent;
    if (mode === "advanced") {
      translateXPercent = -50; // 滑动到左侧，显示高级模式
    } else {
      translateXPercent = 0; // 滑动回基础模式
    }

    // 切换 active 类
    if (mode === "basic") {
      basicModeNavItem.classList.add("active");
      advancedModeNavItem.classList.remove("active");
    } else {
      advancedModeNavItem.classList.add("active");
      basicModeNavItem.classList.remove("active");
    }

    // 应用滑动动画
    modeWrapper.style.transform = `translateX(${translateXPercent}%)`;

    // 更新当前模式
    currentMode = mode;

    // 清空结果区域
    paletteContainer.innerHTML = "";
    paletteContainer.classList.remove("animate-in");
  }

  // 默认先显示基础模式
  switchToMode("basic");

  // 监听导航栏点击事件
  basicModeNavItem.addEventListener("click", () => {
    switchToMode("basic");
  });
  advancedModeNavItem.addEventListener("click", () => {
    switchToMode("advanced");
  });

  // 同步取色器与文本框（基础模式）
  colorPickerBasic.addEventListener("input", () => {
    colorTextBasic.value = colorPickerBasic.value;
  });

  // 同步取色器与文本框（高级模式）
  colorPickerAdvanced.addEventListener("input", () => {
    colorTextAdvanced.value = colorPickerAdvanced.value;
  });

  // 基础模式：生成
  generateBtnBasic.addEventListener("click", () => {
    let colorStr = colorTextBasic.value.trim();
    if (!colorStr) {
      colorStr = colorPickerBasic.value;
    }
    const baseRgb = parseColor(colorStr);
    if (!baseRgb) {
      alert("无效的颜色格式，请输入正确的 HEX、RGB 或 HSL。");
      return;
    }
    // 回写文本框（规范化显示成 HEX）
    colorTextBasic.value = rgbToHex(baseRgb);

    const scheme = schemeSelect.value;
    const resultColors = generateBasicScheme(scheme, baseRgb);
    renderPalette(resultColors);
  });

  // 更新 range 标签
  function updateRangeLabels() {
    hueValue.textContent = `±${hueRange.value}`;
    satValue.textContent = `${satMin.value}% - ${satMax.value}%`;
    lightValue.textContent = `${lightMin.value}% - ${lightMax.value}%`;
  }
  hueRange.addEventListener("input", updateRangeLabels);
  satMin.addEventListener("input", updateRangeLabels);
  satMax.addEventListener("input", updateRangeLabels);
  lightMin.addEventListener("input", updateRangeLabels);
  lightMax.addEventListener("input", updateRangeLabels);
  updateRangeLabels(); // 初始化

  // 高级模式：生成
  generateBtnAdvanced.addEventListener("click", () => {
    let colorStr = colorTextAdvanced.value.trim();
    if (!colorStr) {
      colorStr = colorPickerAdvanced.value;
    }
    const baseRgb = parseColor(colorStr);
    if (!baseRgb) {
      alert("无效的颜色格式，请输入正确的 HEX、RGB 或 HSL。");
      return;
    }
    // 回写文本框
    colorTextAdvanced.value = rgbToHex(baseRgb);

    const hr = parseInt(hueRange.value, 10);
    const sMin = parseInt(satMin.value, 10);
    const sMax = parseInt(satMax.value, 10);
    const lMin = parseInt(lightMin.value, 10);
    const lMax = parseInt(lightMax.value, 10);

    const advColors = generateAdvancedPalette(baseRgb, hr, sMin, sMax, lMin, lMax);
    renderPalette(advColors);
  });
});
