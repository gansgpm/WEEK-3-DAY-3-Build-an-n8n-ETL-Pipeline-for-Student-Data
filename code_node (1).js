// Runs once for EACH student inside the loop
// 1) Original row from "Extract from File" (paired item), 2) AI answer from Basic LLM Chain
let src = {};
try { src = $('Extract from File').item.json; } catch (e) { src = {}; }

let ai = {};
try {
  const t = String($json.text ?? $json.output ?? '').replace(/```json|```/g, '').trim();
  ai = JSON.parse(t);
} catch (e) { ai = {}; }

const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const titleCase = s => clean(s).toLowerCase().split(' ').filter(Boolean)
  .map(w => w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)).join(' ');

// Course: trust the AI only if it returned an allowed value, else fall back to a map
const allowed = ['Python', 'Machine Learning', 'Data Science'];
const courseMap = { 'python': 'Python', 'ml': 'Machine Learning', 'machine learning': 'Machine Learning', 'data science': 'Data Science' };
const rawCourse = clean(src.Course).toLowerCase();
const course = allowed.includes(ai.Course) ? ai.Course : (courseMap[rawCourse] || titleCase(src.Course));

const email = clean(src.Email).toLowerCase();
const emailValid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);

const phone = String(src.Phone ?? '').replace(/\D/g, '');
const fee = clean(src.Fee_Paid).toLowerCase() === 'yes' ? 'Yes' : 'No';
const city = clean(src.City) ? titleCase(src.City) : 'Not Provided';

const d = clean(src.Enrolled_Date).split('-');            // dd-mm-yyyy
const date = d.length === 3 ? `${d[2]}-${d[1]}-${d[0]}` : clean(src.Enrolled_Date); // -> yyyy-mm-dd

return {
  json: {
    Student_ID: clean(src.Student_ID).toUpperCase(),
    Name: titleCase(src.Name),
    Email: email,
    Email_Status: emailValid ? 'Valid' : 'Invalid',
    Phone: phone.length === 10 ? phone : '',
    Course: course,
    Fee_Paid: fee,
    City: city,
    Enrolled_Date: date
  }
};