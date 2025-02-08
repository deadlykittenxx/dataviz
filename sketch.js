let table;
let filters = { Depression: false, Anxiety: false, PanicAttack: false };
let checkboxes = {};
let studentCounts = {}; // Store student counts

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
  const canvas = createCanvas(windowWidth, windowHeight * 1.5);
  canvas.parent("sketch-container");
  textAlign(CENTER, CENTER);
  textFont("Rokkitt");
  noLoop();

  // Create filter checkboxes
  checkboxes["Depression"] = createCheckbox("Depression", false)
    .parent("sketch-container")
    .changed(() => updateFilter("Depression"));
  checkboxes["Anxiety"] = createCheckbox("Anxiety", false)
    .parent("sketch-container")
    .changed(() => updateFilter("Anxiety"));
  checkboxes["PanicAttack"] = createCheckbox("Panic Attack", false)
    .parent("sketch-container")
    .changed(() => updateFilter("PanicAttack"));
}

function draw() {
  background('#f6f4ed');
  translate(width / 2, height / 2);

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

  drawAgeLabels();
  drawAttributeLabels(-PI, 0, attributes);
  drawAttributeLabels(0, PI, attributes);
  drawRadialSegments(-PI, 0, attributes, "female");
  drawRadialSegments(0, PI, attributes, "male");
}

function updateFilter(filter) {
  filters[filter] = checkboxes[filter].checked();
  redraw();
}

function filterData() {
  return table.getRows();
  // let rows = table.getRows();
  // const activeFilters = Object.values(filters).some(val => val);
  // return activeFilters ? rows.filter(row => {
  //   for (let filter in filters) {
  //     if (filters[filter] && row.getString(filter) !== "1") return false;
  //   }
  //   return true;
  // }) : rows;
}

function processStudentCounts(data) {
  studentCounts = {};
  //let maxCount = 0;
  let totalStudents = data.length;

  for (let row of data) {
    let age = +row.getString("Age");
    let gender = row.getString("Gender").toLowerCase();
    let course = row.getString("Course");
    let category = courseCategories[course] || "Unknown";

    if (category === "Unknown") continue;

    let gpa = parseFloat(row.getString("CGPA")) || 0;
    let gpaCategory;
    if (gpa >= 0 && gpa < 1) gpaCategory = "0-1";
    else if (gpa >= 1 && gpa < 2) gpaCategory = "1-2";
    else if (gpa >= 2 && gpa < 3) gpaCategory = "2-3";
    else if (gpa >= 3 && gpa <= 4) gpaCategory = "3-4";
    else gpaCategory = "Unknown";

    let sleepQuality = parseInt(row.getString("SleepQuality").trim()) || 1;
    sleepQuality = Math.min(Math.max(sleepQuality, 1), 5);

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

    

    // filter check
    // let hasCondition = false;
    // if (Object.values(filters).some(val => val)) {
    //   for (let filter in filters) {
    //     if (filters[filter] && row.getString(filter) === "1") {
    //       hasCondition = true;
    //       break;
    //     }
    //   }
    // } else {
    //   // if there's no filter, include all the students
    //   hasCondition = true;
    // }

    let hasAllConditions = true;
    if (Object.values(filters).some(val => val)) {
      for (let filter in filters) {
        if (filters[filter] && row.getString(filter) !== "1") {
          hasAllConditions = false;
          break;
        }
      }
    } else {
      // 필터가 없으면 모든 학생을 포함
      hasAllConditions = true;
    }


    
    for (let attribute in attributeValues) {
      let key = `${age}-${gender}-${attribute}-${attributeValues[attribute]}`;
      if (!studentCounts[key]) {
        studentCounts[key] = { total: 0, condition: 0 };
      }
      studentCounts[key].total++; // 전체 학생 수
      if (hasAllConditions) {
        studentCounts[key].condition++; // 모든 조건 충족 학생 수
      }
    }
  }

  for (let key in studentCounts) {
    if (Object.values(filters).some(val => val)) {
      // 필터가 활성화된 경우: 조건 충족 비율 계산
      studentCounts[key] = studentCounts[key].condition / studentCounts[key].total;
    } else {
      // 필터가 없는 경우: 전체 학생 수 대비 비율 계산
      studentCounts[key] = studentCounts[key].total / totalStudents;
    }
  }
}

function drawRadialSegments(startAngle, endAngle, attributes, gender) {
  let totalAngle = abs(endAngle - startAngle);
  let maxRadius = height / 2.5;
  let radiusStep = maxRadius / 7;

  for (let i = 0; i < attributes.length; i++) {
    let attr = attributes[i];
    let label = attr.label;
    let parts = attr.parts;
    let segmentAngle = totalAngle / attributes.length;
    let attrStartAngle = startAngle + i * segmentAngle;

    if (label === "YearOfStudy") {
      parts = 4;
      let yearSegmentAngle = segmentAngle / parts;

      for (let part = 0; part < parts; part++) {
        let year = part + 1;
        let partStartAngle = attrStartAngle + part * yearSegmentAngle;
        let partEndAngle = partStartAngle + yearSegmentAngle;

        for (let j = 0; j < 7; j++) {
          let age = 18 + j;
          let r = (j + 0.5) * radiusStep;
          let key = `${age}-${gender}-${label}-${year}`;
          let opacity = (studentCounts[key] || 0) * 255;
          opacity = max(opacity, 50);

          fill(gender === 'female' ? [225, 206, 122, opacity] : [191, 210, 191, opacity]);
          noStroke();
          arc(0, 0, r * 2, r * 2, partStartAngle, partEndAngle, PIE);
        }
      }
    } 
    else if (label === "Course") {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;

        for (let j = 0; j < 7; j++) {
          let age = 18 + j;
          let r = (j + 0.5) * radiusStep;
          let key = `${age}-${gender}-${label}-${courseCategoryLabels[part]}`;
          
          let ratio = studentCounts[key] || 0;
          let opacity = ratio * 255; // 0%~100% → 0~255
          opacity = max(opacity, 30);

          fill(gender === 'female' ? [225, 206, 122, opacity] : [191, 210, 191, opacity]);
          noStroke();
          arc(0, 0, r * 2, r * 2, partStartAngle, partEndAngle, PIE);
        }
      }
    }
    else if (label === "AcademicEngagement") {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;

        for (let j = 0; j < 7; j++) {
          let age = 18 + j;
          let r = (j + 0.5) * radiusStep;
          let engagementValue = part + 1;
          let key = `${age}-${gender}-${label}-${engagementValue}`;
          let opacity = (studentCounts[key] || 0) * 255;
          opacity = max(opacity, 50);

          fill(gender === 'female' ? [225, 206, 122, opacity] : [191, 210, 191, opacity]);
          noStroke();
          arc(0, 0, r * 2, r * 2, partStartAngle, partEndAngle, PIE);
        }
      }
    }
    else if (label === "GPA") {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;

        for (let j = 0; j < 7; j++) {
          let age = 18 + j;
          let r = (j + 0.5) * radiusStep;
          let gpaCategory;
          if (part === 0) gpaCategory = "0-1";
          else if (part === 1) gpaCategory = "1-2";
          else if (part === 2) gpaCategory = "2-3";
          else if (part === 3) gpaCategory = "3-4";
          let key = `${age}-${gender}-${label}-${gpaCategory}`;
          let opacity = (studentCounts[key] || 0) * 255;
          opacity = max(opacity, 50);

          fill(gender === 'female' ? [225, 206, 122, opacity] : [191, 210, 191, opacity]);
          noStroke();
          arc(0, 0, r * 2, r * 2, partStartAngle, partEndAngle, PIE);
        }
      }
    }
    else if (label === "SleepQuality") {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;

        for (let j = 0; j < 7; j++) {
          let age = 18 + j;
          let r = (j + 0.5) * radiusStep;
          let sleepQuality = part + 1;
          let key = `${age}-${gender}-${label}-${sleepQuality}`;
          let opacity = (studentCounts[key] || 0) * 255;
          opacity = max(opacity, 50);

          fill(gender === 'female' ? [225, 206, 122, opacity] : [191, 210, 191, opacity]);
          noStroke();
          arc(0, 0, r * 2, r * 2, partStartAngle, partEndAngle, PIE);
        }
      }
    }
    else if (label === "StudyHoursPerWeek") {
      let partAngleStep = segmentAngle / parts;
      const hourCategories = ["1-4", "5-9", "10-14", "15-19"];
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;

        for (let j = 0; j < 7; j++) {
          let age = 18 + j;
          let r = (j + 0.5) * radiusStep;
          let category = hourCategories[part];
          let key = `${age}-${gender}-${label}-${category}`;
          let opacity = (studentCounts[key] || 0) * 255;
          opacity = max(opacity, 50);

          fill(gender === 'female' ? [225, 206, 122, opacity] : [191, 210, 191, opacity]);
          noStroke();
          arc(0, 0, r * 2, r * 2, partStartAngle, partEndAngle, PIE);
        }
      }
    }
    else {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let partStartAngle = attrStartAngle + part * partAngleStep;
        let partEndAngle = partStartAngle + partAngleStep;

        for (let j = 0; j < 7; j++) {
          let age = 18 + j;
          let r = (j + 0.5) * radiusStep;
          let key = `${age}-${gender}-${label}-${part + 1}`;
          let opacity = (studentCounts[key] || 0) * 255;
          opacity = max(opacity, 50);

          fill(gender === 'female' ? [225, 206, 122, opacity] : [191, 210, 191, opacity]);
          noStroke();
          arc(0, 0, r * 2, r * 2, partStartAngle, partEndAngle, PIE);
        }
      }
    }
  }
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

function drawAttributeLabels(startAngle, endAngle, attributes) {
  let totalAngle = abs(endAngle - startAngle);
  let maxRadius = height / 2.5 + 40;

  fill(0);
  textAlign(CENTER, CENTER);
  textSize(10);

  for (let i = 0; i < attributes.length; i++) {
    let attr = attributes[i];
    let label = attr.label;
    let parts = attr.parts;
    let segmentAngle = totalAngle / attributes.length;

    let attrCenterAngle = startAngle + i * segmentAngle + segmentAngle / 2;
    let x = (maxRadius + 20) * cos(attrCenterAngle);
    let y = (maxRadius + 20) * sin(attrCenterAngle);
    text(label, x, y);

    if (label === "YearOfStudy") {
      parts = 4;
      let yearSegmentAngle = segmentAngle / parts;

      for (let part = 0; part < parts; part++) {
        let angle = startAngle + i * segmentAngle + part * yearSegmentAngle + yearSegmentAngle / 2;
        let x = maxRadius * cos(angle);
        let y = maxRadius * sin(angle);
        text(part + 1, x, y);
      }
    } 
    else if (label === "AcademicEngagement") {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let angle = startAngle + i * segmentAngle + part * partAngleStep + partAngleStep / 2;
        let x = maxRadius * cos(angle);
        let y = maxRadius * sin(angle);
        text(part + 1, x, y);
      }
    }
    else if (label === "GPA") {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let angle = startAngle + i * segmentAngle + part * partAngleStep + partAngleStep / 2;
        let x = maxRadius * cos(angle);
        let y = maxRadius * sin(angle);
        let gpaLabel;
        if (part === 0) gpaLabel = "0-1";
        else if (part === 1) gpaLabel = "1-2";
        else if (part === 2) gpaLabel = "2-3";
        else if (part === 3) gpaLabel = "3-4";
        text(gpaLabel, x, y);
      }
    }
    else if (label === "SleepQuality") {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let angle = startAngle + i * segmentAngle + part * partAngleStep + partAngleStep / 2;
        let x = maxRadius * cos(angle);
        let y = maxRadius * sin(angle);
        text(part + 1, x, y);
      }
    }
    else if (label === "StudyHoursPerWeek") {
      const hourLabels = ["1-4", "5-9", "10-14", "15-19"];
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let angle = startAngle + i * segmentAngle + part * partAngleStep + partAngleStep / 2;
        let x = maxRadius * cos(angle);
        let y = maxRadius * sin(angle);
        text(hourLabels[part], x, y);
      }
    }
    else if (label === "Course") {
      let partAngleStep = segmentAngle / parts;
      for (let part = 0; part < parts; part++) {
        let angle = startAngle + i * segmentAngle + part * partAngleStep + partAngleStep / 2;
        let x = maxRadius * cos(angle);
        let y = maxRadius * sin(angle);
        text(courseCategoryLabels[part], x, y); 
      }
    }
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