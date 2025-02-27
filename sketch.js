let table;
let filters = { Depression: false, Anxiety: false, PanicAttack: false };
let checkboxes = {};
let studentCounts = {}; // Store student ratios by condition
let arcs = []; // Array to store arc details for tooltip interaction


let globalMinRatio = Infinity;
let globalMaxRatio = -Infinity;

// Course category mapping
const courseCategories = {
  "Engineering": "Engineering & Technology",
  "Information Technology": "Engineering & Technology",
  "Computer Science": "Engineering & Technology",
  "Mathematics": "Engineering & Technology",
  "Biotechnology": "Life Sciences & Health",
  "Nursing Science": "Life Sciences & Health",
  "Radiography": "Life Sciences & Health",
  "Biomedical Science": "Life Sciences & Health",
  "Pharmacy": "Life Sciences & Health",
  "Marine Science": "Life Sciences & Health",
  "Economics": "Business",
  "Banking and Finance": "Business",
  "Accounting": "Business",
  "Business Administration": "Business",
  "Psychology": "Social Sciences & Humanities",
  "Human Resources": "Social Sciences & Humanities",
  "Islamic Revealed Knowledge and Human Sciences": "Social Sciences & Humanities",
  "Islamic Theology": "Social Sciences & Humanities",
  "Human Sciences": "Social Sciences & Humanities",
  "Law": "Law & Jurisprudence",
  "Islamic Jurisprudence": "Law & Jurisprudence",
  "English Language Education": "Education",
  "English Language and Literature": "Education",
  "Islamic Education": "Education",
  "Arabic Language Education": "Education"
};

// Course category order and labels
const courseCategoryLabels = [
  "Engineering & Technology",
  "Life Sciences & Health",
  "Business",
  "Social Sciences & Humanities",
  "Law & Jurisprudence",
  "Education"
];

function preload() {
  table = loadTable("data/mentalhealth-dataset-cleaned.csv", "header");
}

function setup() {
  const canvas = createCanvas(windowWidth - 50, windowHeight+500);
  canvas.parent("sketch-container");
  canvas.style("display", "block");
  canvas.style("margin", "0 auto");
  canvas.style("padding", "3rem");

  textAlign(CENTER, CENTER);
  textFont("Rokkitt");
  noLoop();

  // Create filter checkboxes
  checkboxes["Depression"] = createCheckbox("Depression", false)
    .parent("sketch-container")
    .position(canvas.position().x, canvas.position().y + 200)
    .changed(() => updateFilter("Depression"));
  checkboxes["Anxiety"] = createCheckbox("Anxiety", false)
    .parent("sketch-container")
    .position(canvas.position().x, canvas.position().y + 230)
    .changed(() => updateFilter("Anxiety"));
  checkboxes["PanicAttack"] = createCheckbox("Panic Attack", false)
    .parent("sketch-container")
    .position(canvas.position().x, canvas.position().y + 260)
    .changed(() => updateFilter("PanicAttack"));
}

function draw() {
  background('#f6f4ed');
  // Move origin to canvas center
  translate(width / 2, height / 2);

  // Clear arcs array
  arcs = [];

  let filteredData = filterData();
  processStudentCounts(filteredData);

  let attributes = [
    { label: "Course", parts: 6 },
    { label: "YearOfStudy", parts: 4 },
    { label: "AcademicEngagement", parts: 5 },
    { label: "SleepQuality", parts: 5 },
    { label: "GPA", parts: 4 },
    { label: "StudyHoursPerWeek", parts: 4 }
  ];

  // 1. Draw radial segments first to fill arcs
  drawRadialSegments(-PI, 0, attributes, "female");
  drawRadialSegments(0, PI, attributes, "male");

  // 2. Compute hovered attribute from arcs based on current mouse position
  let hoveredAttribute = null;
  let mx = mouseX - width / 2;
  let my = mouseY - height / 2;
  let d = sqrt(mx * mx + my * my);
  let a = atan2(my, mx);
  for (let arcObj of arcs) {
    if (d >= arcObj.innerRadius &&
        d <= arcObj.outerRadius &&
        isAngleBetween(a, arcObj.startAngle, arcObj.endAngle)) {
      hoveredAttribute = arcObj.attribute;
      break;
    }
  }

  // 3. Draw attribute labels with color: gray by default, black if hovered
  drawAttributeLabelsWithColor(-PI, 0, attributes, hoveredAttribute);
  drawAttributeLabelsWithColor(0, PI, attributes, hoveredAttribute);

  // 4. Draw age labels
  drawAgeLabels();

  // 5. Draw tooltip (which also displays the sub-label for the hovered segment)
  showTooltip();

  drawGenderLabels();
  // draw() 함수 내에 추가
  drawCategoryDividers();
  
  drawLegend();
  //drawLegendPopup();
  drawDynamicLabel();

  

}

function mouseMoved() {
  // Redraw on mouse move to update tooltip interaction
  redraw();
}

function updateFilter(filter) {
  filters[filter] = checkboxes[filter].checked();
  redraw();
}

function filterData() {
  // Return all rows from the table
  return table.getRows();
}

function processStudentCounts(data) {
  studentCounts = {};
  let genderAgeCounts = {}; // Count total students per age-gender group

  // 초기화
  globalMinRatio = Infinity;
  globalMaxRatio = -Infinity;

  data.forEach(row => {
    let age = +row.getString("Age");
    let gender = row.getString("Gender").toLowerCase();
    let gaKey = `${age}-${gender}`;
    genderAgeCounts[gaKey] = (genderAgeCounts[gaKey] || 0) + 1;

    let course = row.getString("Course");
    let category = courseCategories[course] || "Unknown";
    if (category === "Unknown") return;

    let gpa = parseFloat(row.getString("CGPA")) || 0;
    let gpaCategory = gpa < 1 ? "0-1" : gpa < 2 ? "1-2" : gpa < 3 ? "2-3" : "3-4";

    let sleepQuality = parseInt(row.getString("SleepQuality").trim()) || 1;
    sleepQuality = constrain(sleepQuality, 1, 5);

    let studyHours = row.getString("StudyHoursPerWeek");
    let studyHoursCategory = getStudyHoursCategory(studyHours);

    let attributeValues = {
      "Course": category,
      "YearOfStudy": row.getString("YearOfStudy"),
      "AcademicEngagement": parseInt(row.getString("AcademicEngagement").trim()) || 1,
      "SleepQuality": sleepQuality.toString(),
      "GPA": gpaCategory,
      "StudyHoursPerWeek": studyHoursCategory
    };

    let meetsFilters = true;
    if (Object.values(filters).some(val => val)) {
      for (let f in filters) {
        if (filters[f] && row.getString(f) !== "1") {
          meetsFilters = false;
          break;
        }
      }
    }

    for (let attribute in attributeValues) {
      let key = `${age}-${gender}-${attribute}-${attributeValues[attribute]}`;
      if (!studentCounts[key]) {
        studentCounts[key] = { total: 0, condition: 0 };
      }
      studentCounts[key].total++;
      if (meetsFilters) {
        studentCounts[key].condition++;
      }
    }
  });

  // 비율 계산 및 globalMinRatio, globalMaxRatio 업데이트
  for (let key in studentCounts) {
    let total = studentCounts[key].total;
    if (total === 0) continue; // Avoid division by zero

    if (Object.values(filters).some(val => val)) {
      studentCounts[key].ratio = studentCounts[key].condition / total;
    } else {
      let parts = key.split('-');
      let age = parts[0];
      let gender = parts[1];
      let totalForGroup = genderAgeCounts[`${age}-${gender}`] || 1;
      studentCounts[key].ratio = studentCounts[key].total / totalForGroup;
    }

    // Update globalMinRatio and globalMaxRatio
    const ratio = studentCounts[key].ratio;
    if (!isNaN(ratio)) { // Ensure ratio is a valid number
      if (ratio < globalMinRatio) globalMinRatio = ratio;
      if (ratio > globalMaxRatio) globalMaxRatio = ratio;
    }
  }

  console.log("Global Min Ratio:", globalMinRatio);
  console.log("Global Max Ratio:", globalMaxRatio);
}

function drawArcsForPart(partStartAngle, partEndAngle, keyFunc, gender, radiusStep, minOpacity) {
  for (let j = 0; j < 7; j++) {
    let age = 18 + j;
    let innerR = j * radiusStep;
    let outerR = (j + 1) * radiusStep;
    let key = keyFunc(age);
    let ratio = (studentCounts[key] || { ratio: 0 }).ratio;

    // Ensure globalMinRatio and globalMaxRatio are not both zero
    if (globalMinRatio === globalMaxRatio) {
      globalMaxRatio = globalMinRatio + 1; // Set a default range
    }

    let normalizedRatio = (ratio - globalMinRatio) / (globalMaxRatio - globalMinRatio);
    let opacity = normalizedRatio * 255;

    // Set original colors based on gender
    if (gender === 'female') {
      fill(253, 231, 140, opacity); // Light yellow for female
    } else {
      fill(182, 219, 167, opacity); // Light green for male
    }
    noStroke();
    arc(0, 0, outerR * 2, outerR * 2, partStartAngle, partEndAngle, PIE);

    // Determine sub-label text based on attribute type
    let keyParts = key.split('-'); // Format: "age-gender-attribute-value"
    let rawValue = keyParts[3]; // Original value
    let labelText = rawValue;   // Default

    if (keyParts[2] === "YearOfStudy") {
      const mapping = { "1": "1st year", "2": "2nd year", "3": "3rd year", "4": "4th year" };
      labelText = mapping[rawValue] || rawValue;
    } else if (keyParts[2] === "GPA") {
      const mapping = { "0-1": "0 - 1.0", "1-2": "1.1-2.0", "2-3": "2.1-3.0", "3-4": "3.1-4.0" };
      labelText = mapping[rawValue] || rawValue;
    } else if (keyParts[2] === "StudyHoursPerWeek") {
      const mapping = { "1": "Less than 4 hour", "5": "5-10 hours", "10": "11-14 hours", "15": "More than 15 hours" };
      labelText = mapping[rawValue] || rawValue;
    } else if (keyParts[2] === "AcademicEngagement") {
      if (rawValue === "1") {
        labelText = "Very Low";
      } else if (rawValue === "2") {
        labelText = "Low";
      } else if (rawValue === "3") {
        labelText = "Moderate";
      } else if (rawValue === "4") {
        labelText = "High";
      } else if (rawValue === "5") {
        labelText = "Very High";
      }
    } else if (keyParts[2] === "SleepQuality") {
      if (rawValue === "1") {
        labelText = "Very Poor";
      } else if (rawValue === "2") {
        labelText = "Poor";
      } else if (rawValue === "3") {
        labelText = "Moderate";
      } else if (rawValue === "4") {
        labelText = "Good";
      } else if (rawValue === "5") {
        labelText = "Very Good";
      }
    }

    // Store arc details
    arcs.push({
      age: age,
      gender: gender,
      attribute: keyParts[2],
      value: rawValue,
      labelText: labelText,
      ratio: ratio,
      innerRadius: innerR,
      outerRadius: outerR,
      startAngle: partStartAngle,
      endAngle: partEndAngle
    });
  }
}





function drawRadialSegments(startAngle, endAngle, attributes, gender) {
  blendMode(MULTIPLY); // 색상 중첩 방지
  //blendMode(BLEND);
  let totalAngle = abs(endAngle - startAngle);
  let maxRadius = height / 2.5;
  let radiusStep = maxRadius / 7;

  attributes.forEach((attr, i) => {
    let label = attr.label;
    let parts = attr.parts;
    let segmentAngle = totalAngle / attributes.length;
    let attrStartAngle = startAngle + i * segmentAngle;
    let partAngleStep = segmentAngle / parts;

    if (label === "YearOfStudy") {
      parts = 4;
      let yearSegmentAngle = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * yearSegmentAngle;
        let partEndAngle = partStartAngle + yearSegmentAngle;
        drawArcsForPart(
          partStartAngle,
          partEndAngle,
          age => `${age}-${gender}-YearOfStudy-${part + 1}`,
          gender,
          radiusStep,
          20
        );
      }
    } else if (label === "Course") {
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;
        drawArcsForPart(
          partStartAngle,
          partEndAngle,
          age => `${age}-${gender}-Course-${courseCategoryLabels[part]}`,
          gender,
          radiusStep,
          20
        );
      }
    } else if (label === "AcademicEngagement") {
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;
        drawArcsForPart(
          partStartAngle,
          partEndAngle,
          age => `${age}-${gender}-AcademicEngagement-${part + 1}`,
          gender,
          radiusStep,
          20
        );
      }
    } else if (label === "GPA") {
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;
        let gpaCategory = part === 0 ? "0-1" : part === 1 ? "1-2" : part === 2 ? "2-3" : "3-4";
        drawArcsForPart(
          partStartAngle,
          partEndAngle,
          age => `${age}-${gender}-GPA-${gpaCategory}`,
          gender,
          radiusStep,
          20
        );
      }
    } else if (label === "SleepQuality") {
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;
        drawArcsForPart(
          partStartAngle,
          partEndAngle,
          age => `${age}-${gender}-SleepQuality-${part + 1}`,
          gender,
          radiusStep,
          20
        );
      }
    } else if (label === "StudyHoursPerWeek") {
      const hourCategories = ["1-4", "5-9", "10-14", "15-19"];
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;
        drawArcsForPart(
          partStartAngle,
          partEndAngle,
          age => `${age}-${gender}-StudyHoursPerWeek-${hourCategories[part]}`,
          gender,
          radiusStep,
          20
        );
      }
    } else {
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;
        drawArcsForPart(
          partStartAngle,
          partEndAngle,
          age => `${age}-${gender}-${label}-${part + 1}`,
          gender,
          radiusStep,
          20
        );
      }
    }
  });
  blendMode(BLEND)
}

function drawAgeLabels() {
  let maxRadius = height / 2.5;
  let radiusStep = maxRadius / 7;
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(12);
  for (let i = 0; i < 7; i++) {
    let age = 18 + i;
    let r = (i + 0.5) * radiusStep;
    text(age, r, 10);
  }
}

// Draw main attribute labels with color based on hovered attribute.
// If an attribute label matches the hovered attribute, draw it in black; otherwise, in gray.
function drawAttributeLabelsWithColor(startAngle, endAngle, attributes, hoveredAttribute) {
  let totalAngle = abs(endAngle - startAngle);
  let maxRadius = height / 2.5 + 40;
  textAlign(CENTER, CENTER);
  textSize(18);
  attributes.forEach((attr, i) => {
    let segmentAngle = totalAngle / attributes.length;
    let attrCenterAngle = startAngle + i * segmentAngle + segmentAngle / 2;
    let x = (maxRadius + 20) * cos(attrCenterAngle);
    let y = (maxRadius + 20) * sin(attrCenterAngle);
    // Default color: gray (e.g., 150); if hovered attribute equals attr.label, use black (0)
    fill(150);
  if (attr.label === hoveredAttribute) {
    fill(0);
    stroke(255); // 배경과 대비되는 흰색 테두리
    strokeWeight(1);
  }
  text(attr.label, x, y);
  });
}

function showTooltip() {
  let mx = mouseX - width / 2;
  let my = mouseY - height / 2;
  let d = sqrt(mx * mx + my * my);
  let a = atan2(my, mx);
  let hovered = null;

  // 마우스 위치가 세그먼트 내부에 있는지 확인
  for (let arcObj of arcs) {
    if (
      d >= arcObj.innerRadius &&
      d < arcObj.outerRadius && // 외부 반지름 조건을 포함하지 않도록 수정
      isAngleBetween(a, arcObj.startAngle, arcObj.endAngle)
    ) {
      hovered = arcObj;
      break;
    }
  }

  if (hovered) {
    push();
    resetMatrix();
    let tooltipX = mouseX + 10;
    let tooltipY = mouseY + 10;
    let padding = 5;
    textSize(12);
    let tooltipText = "Age: " + hovered.age +
      ", Ratio: " + nf(hovered.ratio * 100, 1, 1) + "%";
    fill(247, 244, 234);
    stroke(0);
    rectMode(CORNER);
    let tw = textWidth(tooltipText) + padding * 2;
    let th = 16 + padding * 2;
    rect(tooltipX, tooltipY, tw, th);
    noStroke();
    fill(0);
    textAlign(LEFT, TOP);
    text(tooltipText, tooltipX + padding, tooltipY + padding);
    pop();

    // 툴팁의 위치를 정확히 계산
    let mainLabelR = height / 2.5;
    let offset = 20;
    let subLabelR = mainLabelR + offset;
    let midAngle = (hovered.startAngle + hovered.endAngle) / 2;
    let labelX = subLabelR * cos(midAngle);
    let labelY = subLabelR * sin(midAngle);
    push();
    textAlign(CENTER, CENTER);
    textSize(16);
    fill(0);
    text(hovered.labelText, labelX, labelY);
    pop();
  }
}

function isAngleBetween(angle, start, end) {
  let a = (angle + TWO_PI) % TWO_PI;
  let s = (start + TWO_PI) % TWO_PI;
  let e = (end + TWO_PI) % TWO_PI;
  if (s < e) {
    return a >= s && a <= e;
  } else {
    return a >= s || a <= e;
  }
}

function getStudyHoursCategory(hours) {
  hours = parseInt(hours);
  if (hours >= 1 && hours <= 4) return "1-4";
  else if (hours >= 5 && hours <= 9) return "5-9";
  else if (hours >= 10 && hours <= 14) return "10-14";
  else if (hours >= 15 && hours <= 19) return "15-19";
  return "Unknown";
}



function drawGenderLabels() {
  

  
  // Female 라벨 (왼쪽 반원)
  let femaleAngle = -PI/2; // 12시 방향에서 반시계방향으로 90도
  let femaleX = cos(femaleAngle) * (height/2.5 + 20);
  let femaleY = sin(femaleAngle) * (height/2.5 + 100);

  let label = "Gender"; // 표시할 텍스트
  
  let padding = 40; // 배경 사각형 여백
  let textW = textWidth(label) + padding * 2; // 텍스트 너비 + 여백
  let textH = 50;  // 텍스트 높이 (임의 조정 가능)

  // 배경 사각형 그리기
  noStroke();
  fill(253, 231, 140); // 연한 빨강 배경
  rectMode(CENTER);
  rect(femaleX, femaleY, textW, textH); // 중앙 기준으로 배치

  textSize(24);
  fill(0); // 다시 텍스트 색상 설정
  textAlign(CENTER, CENTER);


  text("Female", femaleX, femaleY);

  // Male 라벨 (오른쪽 반원)
  let maleAngle = PI/2; // 12시 방향에서 시계방향으로 90도
  let maleX = cos(maleAngle) * (height/2.5 + 20);
  let maleY = sin(maleAngle) * (height/2.5 + 100);

  noStroke();
  fill(182, 219, 167); // 연한 빨강 배경
  rectMode(CENTER);
  rect(maleX, maleY, textW, textH); // 중앙 기준으로 배치

  textSize(24);
  fill(255); // 다시 텍스트 색상 설정
  textAlign(CENTER, CENTER);
  text("Male", maleX, maleY);
}

function drawCategoryDividers() {
  stroke(255); // 검은색 선
  strokeWeight(1); // 선 두께
  noFill();
  
  let maxRadius = height/2.5;
  
  // 각 성별 절반에 대한 속성 수 (6개)
  let segmentsPerHalf = 6;
  let segmentAngle = PI / segmentsPerHalf; // π/6

  // 여성 절반 (-π ~ 0)
  for (let i = 0; i <= segmentsPerHalf; i++) {
    let angle = -PI + i * segmentAngle;
    let x = cos(angle) * maxRadius;
    let y = sin(angle) * maxRadius;
    line(0, 0, x, y);
  }

  // 남성 절반 (0 ~ π)
  for (let i = 0; i <= segmentsPerHalf; i++) {
    let angle = 0 + i * segmentAngle;
    let x = cos(angle) * maxRadius;
    let y = sin(angle) * maxRadius;
    line(0, 0, x, y);
  }
}


function getAttributeStartAngle(attributeLabel) {
  let totalAngle = PI * 2;
  let index = attributes.findIndex(a => a.label === attributeLabel);
  return (index / attributes.length) * totalAngle - PI;
}

// 레전드 설정
let legend = {
  x: 0,
  y: 0,
  w: 100,     // 너비
  h: height/2.5 * 2, // 원 차트의 지름과 동일한 높이
  margin: 20
};

// drawLegend 함수 수정
function drawLegend() {
  push();
  resetMatrix();
  
  // 레전드 위치 및 크기 설정
  let legendX = 60;
  let legendY = height/2 - 100;
  let gradWidth = 30;
  let gradHeight = 200;

  // 배경 추가
  noFill();
  noStroke();
  rect(legendX + 50, legendY - 10, gradWidth + 50, gradHeight + 20, 5);

  // 부드러운 그라데이션 생성
  for(let y = 0; y < gradHeight; y += 1.5) { // 1.5px 간격으로 밀도 증가
    let alpha = map(y, 0, gradHeight, 0, 255);
    fill(70, 70, 70, alpha); // 더 진한 회색 사용
    noStroke();
    rect(legendX, legendY + y, gradWidth, 2); // 높이 2px로 증가
  }

  // 퍼센트 라벨
  fill(0);
  textAlign(LEFT, CENTER);
  textSize(12);
  text(nf(globalMinRatio*100, 1, 2) + "%", 0, legendY); // 최소값
  text(nf(globalMaxRatio*100, 1, 2) + "%", 0, legendY + gradHeight); // 최대값

  
  // 레전드 제목
  textAlign(CENTER, BOTTOM);
  textSize(14);
  fill(50); // 어두운 회색 텍스트
  text("Percentage Scale", legendX + gradWidth/2, legendY - 15);
  
  pop();
}






function drawDynamicLabel() {
  push();
  resetMatrix();
  translate(0, 50); // 캔버스 상단 중앙
  
  textSize(16);
  textAlign(LEFT, TOP);
  fill(0);

  let activeConditions = Object.keys(filters).filter(k => filters[k]);
  let description = activeConditions.length > 0
    ? `Color brightness shows the percentage of students with 
      ${activeConditions.join(" or ")} in each group`
    : "Color brightness shows the overall distribution of students";

  text(description, 0, 0);
  pop();
}
