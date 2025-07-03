const SUBJECTS_BY_SEMESTER = {
  1: [["HS3152", 3, "Eng 1"], ["MA3151", 4, "Mat 1"], ["PH3151", 3, "Phy 1"], ["CY3151", 3, "Chem 1"], ["GE3151", 3, "Python 1"], ["GE3171", 2, "py lab"], ["BS3171", 2, "phy chem lab"]],
  2: [["HS3251", 2, "Eng 2"], ["MA3251", 4, "Mat 2"], ["PH3254", 3, "Phy 2"], ["BE3254", 3, "EIE"], ["GE3251", 4, "Enginerring Graphics"], ["EC3251", 4, "Circuit analysis"], ["GE3271", 2, "Engg Pratice Lab"], ["EC3271", 1, "Circuit Analysis lab"]],
  3: [["MA3355", 4, "Mat 3"], ["CS3353", 3, "C prgm & data"], ["EC3354", 4, "Signals and system"], ["EC3353", 3, "EDC"], ["EC3351", 3, "Control Systems"], ["EC3352", 4, "Digital system design"], ["EC3361", 1.5, "EDC Lab"], ["CS3362", 1.5, "c & data struct lab"], ["GE3361", 1, "Professional Development"]],
  4: [["EC3452", 3, "EMF"], ["EC3401", 4, "Netw & Sec"], ["EC3451", 3, "LIC"], ["EC3492", 4, "DSP"], ["EC3491", 3, "Commu.Sys"], ["GE3451", 2, "EVS"], ["EC3461", 1.5, "Commu.Sys Lab"], ["EC3462", 1.5, "LIC Lab"]],
  5: [["EC3501", 4, "Wireless Comm"], ["EC3552", 3, "VLSI"], ["EC3551", 3, "TLRF"], ["CEC345", 3, "OCN"], ["CEC331", 3, "4G/5G"], ["CEC354", 3, "SDN"], ["EC3561", 2, "VLSI Lab"]],
  6: [["ET3491", 4, "Embedded Sys & IOT Design"], ["CS3491", 4, "AIML"], ["CEC371", 3, "Space Science"], ["CEC364", 3, "WBN"], ["OAS351", 3, "MIMO"], ["CEC333", 3, "AWC"]],
  7: [["GE3791", 2, "HVE"], ["GE3751", 3, "POM"], ["CCS361", 3, "RPA"], ["OMR351", 3, "Mechatronics"], ["CRA332", 3, "Drone Tech"], ["EC3711", 2, "Internship"]],
  8: [["Project", 10, "Final Year Project"]]
};

const MAX_CGPA = 10;
const MIN_CGPA = 0;
const CGPA_STEP = 0.0001;
const MAX_CREDIT = 10;
const MIN_CREDIT = 0;
const CREDIT_STEP = 0.5;
const FAIL_GRADE = 'U';
const addPrevSemCGPAForSemOne = false;
const addCourseForSemOne = false;
const addArrearCourseForSemOne = false;
const debugValues = false;
const showResultPopUPOverCGPAModel = true;
const includeArrearinGPACalculation = false;

const GRADE_POINTS = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'U': 0 };

const container = document.getElementById('semesterButtons');
const courseContainer = document.getElementById('courseContainer');
const arrearContainer = document.getElementById('arrearContainer');
const arrearControls = document.getElementById('arrearControls');
const prevCgpaField = document.getElementById('prevCgpaField');
const prevCgpaInput = document.getElementById('prevCgpa');
const modal = new bootstrap.Modal(document.getElementById('gpaModal'));
const addCourseBtn = document.getElementById('addCourseBtn');
const arrearCheckbox = document.getElementById('arrearCheckbox');
const addArrearBtn = document.getElementById('addArrearBtn');
const toggleCode = document.getElementById('toggleCodeFancy');
const toggleName = document.getElementById('toggleNameFancy');
const courseSwitch = document.getElementById('courseSwitch');

// Using single <datalist> for arrear suggestions
const dataList = document.createElement('datalist');
dataList.id = 'arrearSuggestions';
document.body.appendChild(dataList);

let currentSemester = null;
let showCourseName = false;
let savedCourseData = []; // [{id, code, credits, grade, isUserAdded}]
let savedArrearData = []; // [{id, code, credits}]
let nextCourseId = 1;
let nextArrearId = 1;

prevCgpaInput.min = MIN_CGPA.toString();
prevCgpaInput.max = MAX_CGPA.toString();
prevCgpaInput.step = CGPA_STEP.toString();

// 1) Semester buttons
Object.keys(SUBJECTS_BY_SEMESTER).forEach(sem => {
  const col = document.createElement('div');
  col.className = 'col-6 col-md-3';
  const btn = document.createElement('button');
  btn.className = 'btn btn-outline-primary w-100';
  btn.textContent = `Semester ${sem}`;
  btn.onclick = () => openSemesterModal(+sem);
  col.appendChild(btn);
  container.appendChild(col);
});

// 2) Open modal & init data
function openSemesterModal(sem) {
  currentSemester = sem;
  showCourseName = false;
  courseSwitch.classList.remove('active');
  toggleName.classList.remove('active');
  toggleCode.classList.add('active');

  // load default subjects
  savedCourseData = SUBJECTS_BY_SEMESTER[sem].map(([code, credits]) => ({
    id: nextCourseId++,
    code,
    credits,
    grade: '',
    isUserAdded: false
  }));

  // clear arrears
  savedArrearData = [];

  // UI reset
  prevCgpaInput.value = '';

  prevCgpaField.classList.toggle('d-none', !addPrevSemCGPAForSemOne && sem === 1);
  addCourseBtn.parentElement.classList.toggle('d-none', !addCourseForSemOne && sem === 1);
  arrearCheckbox.parentElement.classList.toggle('d-none',includeArrearinGPACalculation || (!addArrearCourseForSemOne && sem === 1));
  arrearCheckbox.checked = false;
  arrearControls.classList.add('d-none');
  arrearContainer.innerHTML = '';
  document.getElementById('modalTitle').textContent = `GPA Calculator - Semester ${sem}`;

  // populate the arrear datalist with all courses from prior semesters
  populateArrearDatalist();

  renderSavedCourses();
  
  modal.show();
}

// 3) Add custom course
addCourseBtn.addEventListener('click', () => {
  const rows = courseContainer.querySelectorAll('.form-inline-group');
  let ok = true;
  rows.forEach(row => {
    const id = +row.dataset.id;
    const e = savedCourseData.find(x => x.id === id);
    if (!e.isUserAdded) return;
    const [subj, cred] = row.querySelectorAll('input');
    const grade = row.querySelector('select');
    const c = parseFloat(cred.value);
    if (!subj.value.trim()) {
      subj.classList.add('invalid-field');
      ok = false;
    } else {
      subj.classList.remove('invalid-field');
    }
    if (
      cred.value.trim() === '' ||
      isNaN(c) ||
      c < MIN_CREDIT ||
      c > MAX_CREDIT
    ) {
      cred.classList.add('invalid-field');
      ok = false;
    } else {
      cred.classList.remove('invalid-field');
    }
    if (!grade.value) {
      grade.classList.add('invalid-field');
      ok = false;
    } else {
      grade.classList.remove('invalid-field');
    }
  });
  if (!ok) return;

  const entry = { id: nextCourseId++, code: '', credits: '', grade: '', isUserAdded: true };
  savedCourseData.push(entry);
  addCourseRow(entry);
});

// 4) Add arrear course
addArrearBtn.addEventListener('click', () => {
  const rows = arrearContainer.querySelectorAll('.form-inline-group');
  let ok = true;
  rows.forEach(row => {
    const [ci, cr] = row.querySelectorAll('input');
    const c = parseFloat(cr.value);
    if (!ci.value.trim()) {
      ci.classList.add('invalid-field');
      ok = false;
    } else {
      ci.classList.remove('invalid-field');
    }
    if (
      cr.value.trim() === '' ||
      isNaN(c) ||
      c < MIN_CREDIT ||
      c > MAX_CREDIT
    ) {
      cr.classList.add('invalid-field');
      ok = false;
    } else {
      cr.classList.remove('invalid-field');
    }
  });
  if (!ok) return;

  const entry = { id: nextArrearId++, code: '', credits: '' };
  savedArrearData.push(entry);
  addArrearRow(entry);
});

// 5) Toggle handlers (CourseID <-> Name)
toggleCode.addEventListener('click', () => {
  captureAllData();
  showCourseName = false;
  courseSwitch.classList.remove('active');
  toggleCode.classList.add('active');
  toggleName.classList.remove('active');
  reRenderAll();
});
toggleName.addEventListener('click', () => {
  captureAllData();
  showCourseName = true;
  courseSwitch.classList.add('active');
  toggleName.classList.add('active');
  toggleCode.classList.remove('active');
  reRenderAll();
});

// 6) Prev CGPA validator
prevCgpaInput.addEventListener('blur', () => {
  const val = parseFloat(prevCgpaInput.value);
  if (
    prevCgpaInput.value.trim() === '' ||
    isNaN(val) ||
    val < MIN_CGPA ||
    val > MAX_CGPA
  ) {
    prevCgpaInput.classList.add('invalid-field');
  } else {
    prevCgpaInput.classList.remove('invalid-field');
  }
});

// 7) Arrear Checkbox logic
arrearCheckbox.addEventListener('change', () => {
  if (arrearCheckbox.checked) arrearControls.classList.remove('d-none');
  else {
    arrearControls.classList.add('d-none');
    savedArrearData = [];
    arrearContainer.innerHTML = '';
  }
});

// 8) Single row creator
function addCourseRow(entry) {
  const { id, code, credits, grade, isUserAdded } = entry;
  const row = document.createElement('div');
  row.className = 'form-inline-group';
  row.dataset.id = id;

  // Subject field
  const subjInput = document.createElement('input');
  subjInput.type = 'text';
  subjInput.className = 'form-control';
  subjInput.readOnly = !isUserAdded;
  subjInput.value = !isUserAdded && showCourseName ? getLabel(code) : code;
  subjInput.placeholder = isUserAdded ? 'Subject' : 'Subject Code';

  // Credits field (1–10, decimals allowed)
  const credInput = document.createElement('input');
  credInput.type = 'number';
  credInput.className = 'form-control';
  credInput.readOnly = !isUserAdded;
  credInput.value = credits;
  credInput.placeholder = 'Credits';
  credInput.min = MIN_CREDIT.toString();
  credInput.max = MAX_CREDIT.toString();
  credInput.step = CREDIT_STEP.toString();
  credInput.style.maxWidth = isUserAdded ? '80px' : '60px';

  // Grade select
  const gradeSelect = document.createElement('select');
  gradeSelect.className = 'form-select';
  const placeOpt = document.createElement('option');
  placeOpt.value = '';
  placeOpt.text = isUserAdded ? 'Grade' : 'Select Grade';
  placeOpt.disabled = true;
  placeOpt.selected = (grade === '');
  gradeSelect.append(placeOpt);
  Object.keys(GRADE_POINTS).forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.text = g;
    if (g === grade) opt.selected = true;
    gradeSelect.append(opt);
  });

  row.append(subjInput, credInput, gradeSelect);

  // delete for user-added
  if (isUserAdded) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-outline-danger';
    del.innerHTML = '<i class="bi bi-trash"></i>';
    del.onclick = () => {
      savedCourseData = savedCourseData.filter(e => e.id !== id);
      row.remove();
    };
    row.append(del);
  }
  credInput.addEventListener('blur', () => {
    validateNumberInputField(credInput);
  });

  courseContainer.append(row);
}

// 9) Arrear row creator
function addArrearRow(entry) {
  const { id, code, credits } = entry;
  const row = document.createElement('div');
  row.className = 'form-inline-group';
  row.dataset.id = id;

  const ci = document.createElement('input');
  ci.type = 'text';
  ci.className = 'form-control';
  ci.placeholder = 'Arrear Sub Code';
  ci.value = code;
  ci.setAttribute('list', 'arrearSuggestions');
  ci.addEventListener('input', () => {
    const opt = [...dataList.options].find(o => o.value === ci.value);
    if (opt) creditInput.value = opt.getAttribute('data-credits');
  });

  const creditInput = document.createElement('input');
  creditInput.type = 'number';
  creditInput.className = 'form-control';
  creditInput.placeholder = 'Credits';
  creditInput.value = credits;
  creditInput.min = MIN_CREDIT.toString();
  creditInput.max = MAX_CREDIT.toString();
  creditInput.step = CREDIT_STEP.toString();
  creditInput.style.maxWidth = '80px';

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn btn-outline-danger';
  del.innerHTML = '<i class="bi bi-trash"></i>';
  del.onclick = () => {
    savedArrearData = savedArrearData.filter(x => x.id !== id);
    row.remove();
  };
  creditInput.addEventListener('blur', () => {
    validateNumberInputField(creditInput);
  });


  row.append(ci, creditInput, del);
  arrearContainer.append(row);
}

// 10) CGPA Calculation Logic
function handleCalculateClick() {
  captureAllData();
  let valid = true;

  // prev CGPA
  if (!prevCgpaField.classList.contains('d-none')) {
    const val = parseFloat(prevCgpaInput.value);
    if (
      prevCgpaInput.value.trim() === '' ||
      isNaN(val) ||
      val < MIN_CGPA ||
      val > MAX_CGPA
    ) {
      prevCgpaInput.classList.add('invalid-field');
      valid = false;
    } else {
      prevCgpaInput.classList.remove('invalid-field');
    }
  }

  // courses
  courseContainer.querySelectorAll('.form-inline-group').forEach(row => {
    const [subj, cred] = row.querySelectorAll('input');
    const grade = row.querySelector('select');
    const c = parseFloat(cred.value);
    if (!subj.value.trim()) {
      subj.classList.add('invalid-field');
      valid = false;
    } else {
      subj.classList.remove('invalid-field');
    }
    if (
      cred.value.trim() === '' ||
      isNaN(c) ||
      c < MIN_CREDIT ||
      c > MAX_CREDIT
    ) {
      cred.classList.add('invalid-field');
      valid = false;
    } else {
      cred.classList.remove('invalid-field');
    }
    if (!grade.value) {
      grade.classList.add('invalid-field');
      valid = false;
    } else {
      grade.classList.remove('invalid-field');
    }
  });

  // arrears
  if (!arrearControls.classList.contains('d-none')) {
    arrearContainer.querySelectorAll('.form-inline-group').forEach(row => {
      const [ci, cr] = row.querySelectorAll('input');
      const c = parseFloat(cr.value);
      if (!ci.value.trim()) {
        ci.classList.add('invalid-field');
        valid = false;
      } else {
        ci.classList.remove('invalid-field');
      }
      if (
        cr.value.trim() === '' ||
        isNaN(c) ||
        c < MIN_CREDIT ||
        c > MAX_CREDIT
      ) {
        cr.classList.add('invalid-field');
        valid = false;
      } else {
        cr.classList.remove('invalid-field');
      }
    });
  }

  if (!valid) return;

  // ——— GPA Calculation  ———
  const semesterCredits = includeArrearinGPACalculation? getTotalCreditsInCurrentSemester() : getPassedCreditsInCurrentSemester();
  const semesterPoints = getWeightedSumPredefined() + getWeightedSumUserAdded();
  const GPA = (semesterPoints / semesterCredits) || 0;

  // ——— CGPA Calculation ———
  const oldCredits = getTotalCreditsBeforeSemester(currentSemester);
  const oldCGPA = getPreviousSemesterCGPA();
  const arrearCredits = getLiveArrearCredits() || 0;

  const adjustedOldCredits = oldCredits;
  if (!includeArrearinGPACalculation){
    adjustedOldCredits = oldCredits - arrearCredits;
  }
  const totalOldPoints = oldCGPA * adjustedOldCredits;

  const currentSemPoints = GPA * semesterCredits;
  const totalAllPoints = totalOldPoints + currentSemPoints;
  const totalAllCredits = adjustedOldCredits + semesterCredits;

  const CGPA = totalAllPoints / totalAllCredits;

  document.getElementById('resultSemNo').textContent = currentSemester;

  // Set GPA
  document.getElementById('resultGpa').textContent = GPA.toFixed(3);

  // Prepare CGPA label text
  const cgpaLabel = document.getElementById('cgpaLabel');
  const cgpaArrow = document.getElementById('cgpaArrow');
  document.getElementById('resultCgpa').textContent = CGPA.toFixed(3);


  cgpaLabel.textContent = isLastSemester(currentSemester) ? "Final CGPA" : `CGPA till Sem ${currentSemester}`;

  const prevCGPA = oldCGPA;
  if (CGPA > prevCGPA) {
    cgpaArrow.innerHTML = '&#8593;'; // up arrow
    cgpaArrow.className = 'cgpa-arrow up ms-2';
    cgpaArrow.style.color = 'green';
  } else if (CGPA < prevCGPA) {
    cgpaArrow.innerHTML = '&#8595;'; // down arrow
    cgpaArrow.className = 'cgpa-arrow down ms-2';
    cgpaArrow.style.color = 'red';
  } else {
    cgpaArrow.innerHTML = '&#8212;';
    cgpaArrow.className = 'cgpa-arrow hyphen ms-2';
    cgpaArrow.style.color = 'orange';
  }

  if (debugValues) {
    console.log("============ DEBUG LOGS ============");

    const dbg_passedCredits = getPassedCreditsInCurrentSemester();
    console.log("Passed credits in current sem:", dbg_passedCredits);
    
    const dbg_CreditsOfCurrentSem = getTotalCreditsInCurrentSemester();
    console.log("Total Credits in current sem:", dbg_CreditsOfCurrentSem);

    const dbg_weightedSumPredef = getWeightedSumPredefined();
    console.log("Credits * Grade Points (Predefined Courses):", dbg_weightedSumPredef);

    const dbg_weightedSumUser = getWeightedSumUserAdded();
    console.log("Credits * Grade Points (Additional Courses):", dbg_weightedSumUser);

    const dbg_semesterPoints = dbg_weightedSumPredef + dbg_weightedSumUser;
    console.log("Total semester points (predef + user):", dbg_semesterPoints);

    const dbg_GPA = (dbg_semesterPoints / dbg_passedCredits) || 0;
    console.log("GPA (current sem):", dbg_GPA.toFixed(3));

    const dbg_oldCredits = getTotalCreditsBeforeSemester(currentSemester);
    console.log("Total credits before current sem:", dbg_oldCredits);

    const dbg_oldCGPA = getPreviousSemesterCGPA();
    console.log("Old CGPA :", dbg_oldCGPA);

    const dbg_adjustedOldCredits = dbg_oldCredits;
    if (!includeArrearinGPACalculation){
        const dbg_arrearCredits = getLiveArrearCredits();
        console.log("Total arrear credits :", dbg_arrearCredits);
        dbg_adjustedOldCredits = dbg_oldCredits - dbg_arrearCredits;
        console.log("Adjusted old credits (excluding arrears):", dbg_adjustedOldCredits);
    }

    const dbg_totalOldPoints = dbg_oldCGPA * dbg_adjustedOldCredits;
    console.log("Total semester points from previous sems:", dbg_totalOldPoints);

    const dbg_currentSemPoints = dbg_GPA * (includeArrearinGPACalculation? dbg_CreditsOfCurrentSem : dbg_passedCredits);
    console.log("Points from current sem (GPA * sem credits):", dbg_currentSemPoints);

    const dbg_totalAllPoints = dbg_totalOldPoints + dbg_currentSemPoints;
    console.log("Total points including current sem:", dbg_totalAllPoints);

    const dbg_totalAllCredits = dbg_adjustedOldCredits + dbg_passedCredits;
    console.log("Total credits including current sem:", dbg_totalAllCredits);

    const dbg_CGPA = (dbg_totalAllPoints / dbg_totalAllCredits) || 0;
    console.log("Final CGPA (all sems):", dbg_CGPA.toFixed(3));

    console.log("====================================");
  }

  // Show the result modal
  if (showResultPopUPOverCGPAModel){
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();
  } else {
    // Show result pop up after closing cgpa entering field
    const gpaModalEl = document.getElementById('gpaModal');
    const gpaModalInstance = bootstrap.Modal.getInstance(gpaModalEl);
    if (gpaModalInstance) gpaModalInstance.hide();

    const resultModalEl = document.getElementById('resultModal');
    const resultModal = new bootstrap.Modal(resultModalEl);
    resultModal.show();
  }

}

// Helpers for UI functionality
function validateNumberInputField(input) {
  const val = parseFloat(input.value);
  if (
    input.value.trim() === '' ||
    isNaN(val) ||
    val < MIN_CREDIT ||
    val > MAX_CREDIT
  ) {
    input.classList.add('invalid-field');
  } else {
    input.classList.remove('invalid-field');
  }
}

function getLabel(code) {
  for (const arr of Object.values(SUBJECTS_BY_SEMESTER)) {
    for (const [c, , name] of arr) {
      if (c === code) return name;
    }
  }
  return code;
}

function populateArrearDatalist() {
  dataList.innerHTML = '';
  for (let s = 1; s < currentSemester; s++) {
    for (const [code, credits, name] of SUBJECTS_BY_SEMESTER[s]) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.label = name;
      opt.setAttribute('data-credits', credits);
      dataList.appendChild(opt);
    }
  }
}

function renderSavedCourses() {
  courseContainer.innerHTML = '';
  savedCourseData.forEach(addCourseRow);
}

function captureAllData() {
  captureCourseData();
  captureArrearData();
}

function captureCourseData() {
  courseContainer.querySelectorAll('.form-inline-group').forEach(row => {
    const id = +row.dataset.id;
    const e = savedCourseData.find(x => x.id === id);
    if (!e) return;
    const [si, ci] = row.querySelectorAll('input');
    const sel = row.querySelector('select');
    if (e.isUserAdded) { e.code = si.value; e.credits = ci.value; }
    e.grade = sel.value;
  });
}

function captureArrearData() {
  arrearContainer.querySelectorAll('.form-inline-group').forEach(row => {
    const id = +row.dataset.id;
    const e = savedArrearData.find(x => x.id === id);
    if (!e) return;
    const [ci, cr] = row.querySelectorAll('input');
    e.code = ci.value;
    e.credits = cr.value;
  });
}

function reRenderAll() {
  renderSavedCourses();
  arrearContainer.innerHTML = '';
  savedArrearData.forEach(addArrearRow);
  if (savedArrearData.length) arrearControls.classList.remove('d-none');
}

// Helpers for CGPA and GPA calculations
const isLastSemester = (semNumber) => {
  const maxSem = Math.max(...Object.keys(SUBJECTS_BY_SEMESTER).map(Number));
  return semNumber === maxSem;
};

function getPassedCreditsInCurrentSemester() {
  return savedCourseData
    .filter(e => e.grade && e.grade.toUpperCase() !== FAIL_GRADE)
    .map(e => parseFloat(e.credits) || 0)
    .reduce((sum, c) => sum + c, 0);
}

function getTotalCreditsInCurrentSemester() {
  return savedCourseData
    .map(e => parseFloat(e.credits) || 0)
    .reduce((sum, c) => sum + c, 0);
}

function getLiveArrearCredits() {
  return savedArrearData
    .map(a => parseFloat(a.credits) || 0)
    .reduce((sum, c) => sum + c, 0);
}

function getTotalCreditsBeforeSemester(sem) {
  if (sem <= 1) return 0;
  let sum = 0;
  for (let s = 1; s < sem; s++) {
    SUBJECTS_BY_SEMESTER[s].forEach(([_, creds]) => {
      sum += Number(creds) || 0;
    });
  }
  return sum;
}

function getWeightedSumPredefined() {
  return savedCourseData
    .filter(e => !e.isUserAdded && e.grade)              
    .map(e => {
      const creds = parseFloat(e.credits) || 0;
      const gp = GRADE_POINTS[e.grade] || 0;
      return creds * gp;
    })
    .reduce((sum, v) => sum + v, 0);
}

function getPreviousSemesterCGPA() {
  const raw = prevCgpaInput.value.trim();
  const sem = currentSemester - 1;

  if (prevCgpaField.classList.contains('d-none') || raw === '') {
    console.log(`No previous CGPA for Sem ${sem} (treating as 0)`);
    return 0;
  }

  const cgpa = parseFloat(raw);
  if (isNaN(cgpa) || cgpa < MIN_CGPA || cgpa > MAX_CGPA) {
    console.log(`Invalid previous CGPA entered: "${raw}". Must be 0–10.`);
    return 0;
  }

  console.log(`CGPA through Semester ${sem}:`, cgpa);
  return cgpa;
}

function getWeightedSumUserAdded() {
  return savedCourseData
    .filter(e => e.isUserAdded && e.grade)              
    .map(e => {
      const creds = parseFloat(e.credits) || 0;
      const gp = GRADE_POINTS[e.grade] || 0;
      return creds * gp;
    })
    .reduce((sum, v) => sum + v, 0);
}
