let table;
let filters = { Depression: false, Anxiety: false, PanicAttack: false };
let checkboxes = {};
let studentCounts = {}; // Store student ratios by condition
let arcs = []; // Array to store arc details for tooltip interaction

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
  const canvas = createCanvas(windowWidth - 50, windowHeight + 500);
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

  for (let key in studentCounts) {
    if (Object.values(filters).some(val => val)) {
      studentCounts[key] = studentCounts[key].condition / studentCounts[key].total;
    } else {
      let parts = key.split('-');
      let age = parts[0];
      let gender = parts[1];
      let totalForGroup = genderAgeCounts[`${age}-${gender}`] || 1;
      studentCounts[key] = studentCounts[key].total / totalForGroup;
    }
  }
}

// ------------------------
// DRAWING FUNCTIONS
// ------------------------

// drawArcsForPart: Draws arcs for all age rings for a given segment and stores details (including transformed sub-label text)
function drawArcsForPart(partStartAngle, partEndAngle, keyFunc, gender, radiusStep, minOpacity) {
  for (let j = 0; j < 7; j++) {
    let age = 18 + j;
    let innerR = j * radiusStep;
    let outerR = (j + 1) * radiusStep;
    let r = (j + 0.5) * radiusStep;
    let key = keyFunc(age); // e.g., "18-female-YearOfStudy-1"
    let ratio = (studentCounts[key] || 0);
    let opacity = ratio * 255;
    opacity = max(opacity, minOpacity);
    
    if (gender === 'female') {
      fill(225, 206, 122, opacity);
    } else {
      fill(191, 210, 191, opacity);
    }
    noStroke();
    arc(0, 0, r * 2, r * 2, partStartAngle, partEndAngle, PIE);
    
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
      // For Academic Engagement, display endpoints (or a range if desired)
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
    
    arcs.push({
      age: age,
      gender: gender,
      attribute: keyParts[2],
      value: rawValue,      // Original value
      labelText: labelText, // Transformed sub-label text
      ratio: ratio,
      innerRadius: innerR,
      outerRadius: outerR,
      startAngle: partStartAngle,
      endAngle: partEndAngle
    });
  }
}

function drawRadialSegments(startAngle, endAngle, attributes, gender) {
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
    if (attr.label === hoveredAttribute) {
      fill(0);
    } else {
      fill(150);
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

  for (let arcObj of arcs) {
    if (
      d >= arcObj.innerRadius &&
      d <= arcObj.outerRadius &&
      isAngleBetween(a, arcObj.startAngle, arcObj.endAngle)
    ) {
      hovered = arcObj;
      break;
    }
  }

  if (hovered) {
    // Draw tooltip background using screen coordinates
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

    // Draw sub-label outside the circle (below the main label)
    let mainLabelR = height / 2.5;
    let offset = 20;
    let subLabelR = mainLabelR + offset;
    let midAngle = (hovered.startAngle + hovered.endAngle) / 2;
    let labelX = subLabelR * cos(midAngle);
    let labelY = subLabelR * sin(midAngle);
    push();
    //translate(width / 2, height / 2);
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
