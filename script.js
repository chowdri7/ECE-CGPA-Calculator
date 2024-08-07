const SUBJECTS_BY_SEMESTER = {
    1: [["HS3152", 3], ["MA3151", 4], ["PH3151", 3], ["CY3151", 3], ["GE3151", 3], ["GE3171", 2], ["BS3171", 2]],
    2: [["HS3251", 2], ["MA3251", 4], ["PH3254", 3], ["BE3254", 3], ["GE3251", 4], ["EC3251", 4], ["GE3271", 2], ["EC3271", 1]],
    3: [["MA3355", 4], ["CS3353", 3], ["EC3354", 4], ["EC3353", 3], ["EC3351", 3], ["EC3352", 4], ["EC3361", 1.5], ["CS3362", 1.5], ["GE3361", 1]],
    4: [["EC3452", 3], ["EC3401", 4], ["EC3451", 3], ["EC3492", 4], ["EC3491", 3], ["GE3451", 2], ["EC3461", 1.5], ["EC3462", 1.5]],
    5: [["EC3501", 4], ["EC3552", 3], ["EC3551", 3], ["CEC345", 3], ["CEC331", 3], ["CEC354", 3], ["EC3561", 2]],
    6: [["ET3491", 4], ["CS3491", 4], ["CEC371", 3], ["CEC364", 3], ["OAS351", 3], ["CEC333", 3]],
    7: [["MAT401", 3], ["PHY401", 3], ["CHE401", 3], ["CSE401", 3], ["ENG401", 3], ["BIO401", 3]],
    8: [["MAT402", 3], ["PHY402", 3], ["CHE402", 3], ["CSE402", 3], ["ENG402", 3], ["BIO402", 3]],
};

const GRADE_POINTS = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'U': 0
};

function openCGPACalculator(semester) {
    const cgpaForm = document.getElementById('cgpaForm');
    cgpaForm.innerHTML = '';

    document.getElementById('semesterLabel').innerText = semester;

    const subjects = SUBJECTS_BY_SEMESTER[semester];
    subjects.forEach(([subject, credits], index) => {
        const row = document.createElement('div');
        row.className = 'form-group row';

        const subjectLabel = document.createElement('label');
        subjectLabel.className = 'col-sm-2 col-form-label';
        subjectLabel.style="display:flex;flex-direction:row;justify-content: space-between;"
        subjectLabel.innerHTML = `<p style="margin-right:20px;">${subject}</p><p>Credits:${credits}</p>`;
        row.appendChild(subjectLabel);


        const selectCol = document.createElement('div');
        selectCol.className = 'col-sm-4';
        selectCol.style="margin-left:15px;";
        const select = document.createElement('select');
        select.className = 'form-control';
        select.style=`width:275px;select {
            width: 100%;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            padding: 10px;
        }`;
        select.id = `grade-${index}`;
        Object.keys(GRADE_POINTS).forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.text = grade;
            select.appendChild(option);
        });
        selectCol.appendChild(select);
        row.appendChild(selectCol);

        cgpaForm.appendChild(row);
    });

    if (semester > 1) {
        // Add previous CGPA input
        const prevCGPARow = document.createElement('div');
        prevCGPARow.className = 'form-group row';
        // prevCGPARow.style="background-color:green;display:flex;flex-direction:row;";

        const prevCGPALabel = document.createElement('label');
        prevCGPALabel.className = 'col-sm-4 col-form-label';
        prevCGPALabel.innerText = 'Previous CGPA';
        prevCGPARow.appendChild(prevCGPALabel);

        const prevCGPAInputCol = document.createElement('div');
        prevCGPAInputCol.className = 'col-sm-8';
        const prevCGPAInput = document.createElement('input');
        prevCGPAInput.type = 'number';
        prevCGPAInput.className = 'form-control';
        prevCGPAInput.id = 'previousCGPA';
        prevCGPAInputCol.appendChild(prevCGPAInput);
        prevCGPARow.appendChild(prevCGPAInputCol);

        cgpaForm.appendChild(prevCGPARow);
    }

    // Add Course Button
    const addCourseButton = document.createElement('button');
    addCourseButton.className = 'btn btn-secondary';
    addCourseButton.innerText = 'Add Course';
    addCourseButton.onclick = addCourse;

    cgpaForm.appendChild(addCourseButton);

    $('#cgpaCalculatorModal').modal('show');
}

function addCourse() {
    const cgpaForm = document.getElementById('cgpaForm');

    const row = document.createElement('div');
    row.className = 'form-group row';

    const subjectInput = document.createElement('input');
    subjectInput.className = 'form-control col-sm-2';
    subjectInput.type = 'text';
    subjectInput.placeholder = 'Course Code';
    row.appendChild(subjectInput);

    const creditsInput = document.createElement('input');
    creditsInput.className = 'form-control col-sm-2';
    creditsInput.type = 'number';
    creditsInput.min = 0;
    creditsInput.max = 10;
    creditsInput.placeholder = 'Credits';
    row.appendChild(creditsInput);

    const selectCol = document.createElement('div');
    selectCol.className = 'col-sm-4';
    const select = document.createElement('select');
    select.className = 'form-control';
    Object.keys(GRADE_POINTS).forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.text = grade;
        select.appendChild(option);
    });
    selectCol.appendChild(select);
    row.appendChild(selectCol);

    cgpaForm.insertBefore(row, cgpaForm.lastElementChild);
}

function calculateGPA() {
    const grades = document.querySelectorAll('select[id^="grade-"]');
    const semester = parseInt(document.getElementById('semesterLabel').innerText);
    const previousCGPA = semester > 1 ? parseFloat(document.getElementById('previousCGPA').value) || 0 : 0;
    const subjects = SUBJECTS_BY_SEMESTER[semester];
    let totalCredits = 0;
    let totalPoints = 0;

    grades.forEach((select, index) => {
        const grade = select.value;
        const credits = subjects[index][1];
        if (grade !== 'U') {
            totalCredits += credits;
            totalPoints += GRADE_POINTS[grade] * credits;
        }
    });
    const real=totalPoints/totalCredits;
    console.log("Total credits : "+totalCredits+" Total poins : "+totalPoints);

    // Include added courses
    const addedCourses = document.querySelectorAll('#cgpaForm .form-group.row');
    addedCourses.forEach(courseRow => {
        const courseInputs = courseRow.querySelectorAll('input, select');
        if (courseInputs.length === 3) {
            const grade = courseInputs[2].value;
            const credits = parseFloat(courseInputs[1].value) || 0;
            if (grade !== 'U') {
                totalCredits += credits;
                totalPoints += GRADE_POINTS[grade] * credits;
            }
        }
    });

    const GPA = totalPoints / totalCredits;
    const CGPA = semester === 1 ? GPA : ((previousCGPA * (semester - 1)) + GPA) / semester;

    document.getElementById('resultBody').innerHTML = `<p>GPA: ${real.toFixed(2)}</p><p>CGPA: ${CGPA.toFixed(2)}</p>`;
    $('#resultModal').modal('show');
    document.getElementById("cgpaCalculatorModal").innerHTML=" ";
    // document.getElementById("cgpaCalculatorModal").innerHTML = <div class="modal-header">
}

// To prevent scrolling the background content when modal is open
$(document).on('show.bs.modal', function () {
    $('body').css('overflow', 'hidden');
}).on('hidden.bs.modal', function () {
    $('body').css('overflow', 'auto');
});
