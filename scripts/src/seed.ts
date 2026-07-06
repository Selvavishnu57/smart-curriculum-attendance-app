import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../lib/db/src/schema";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding database...");

  // Clear existing data in order (to avoid FK issues if any)
  await db.delete(schema.activityLogTable);
  await db.delete(schema.notificationsTable);
  await db.delete(schema.activitiesTable);
  await db.delete(schema.attendanceTable);
  await db.delete(schema.timetableTable);
  await db.delete(schema.usersTable);
  await db.delete(schema.studentsTable);
  await db.delete(schema.facultyTable);
  await db.delete(schema.subjectsTable);
  await db.delete(schema.departmentsTable);

  // 1. DEPARTMENTS
  const deptData = [
    { name: "Computer Science and Engineering", code: "CSE", hodName: "Dr. R. Krishnamurthy" },
    { name: "Electronics and Communication Engineering", code: "ECE", hodName: "Dr. S. Venkatesh" },
    { name: "Mechanical Engineering", code: "MECH", hodName: "Dr. P. Anandan" },
    { name: "Electrical and Electronics Engineering", code: "EEE", hodName: "Dr. K. Rajagopal" },
    { name: "Civil Engineering", code: "CIVIL", hodName: "Dr. M. Selvam" },
    { name: "Information Technology", code: "IT", hodName: "Dr. A. Priya" },
  ];
  const departments = await db.insert(schema.departmentsTable).values(deptData).returning();
  const cseDept = departments.find(d => d.code === "CSE")!;
  const eceDept = departments.find(d => d.code === "ECE")!;
  const mechDept = departments.find(d => d.code === "MECH")!;
  const eeeDept = departments.find(d => d.code === "EEE")!;
  const civilDept = departments.find(d => d.code === "CIVIL")!;
  const itDept = departments.find(d => d.code === "IT")!;
  console.log("Departments seeded:", departments.length);

  // 2. SUBJECTS (Anna University 2026 Curriculum)
  const subjectData = [
    // CSE Semester 1
    { code: "MA3151", name: "Matrices and Calculus", department: "CSE", semester: 1, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "PH3151", name: "Engineering Physics", department: "CSE", semester: 1, credits: 4, lectureHours: 3, practicalHours: 2, category: "Core" },
    { code: "CY3151", name: "Engineering Chemistry", department: "CSE", semester: 1, credits: 4, lectureHours: 3, practicalHours: 2, category: "Core" },
    { code: "GE3151", name: "Problem Solving and Python Programming", department: "CSE", semester: 1, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
    { code: "GE3152", name: "Heritage of Tamil", department: "CSE", semester: 1, credits: 1, lectureHours: 1, practicalHours: 0, category: "Mandatory" },
    // CSE Semester 2
    { code: "MA3251", name: "Statistics and Numerical Methods", department: "CSE", semester: 2, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "PH3256", name: "Physics for Information Science", department: "CSE", semester: 2, credits: 4, lectureHours: 3, practicalHours: 2, category: "Core" },
    { code: "CS3251", name: "Programming in C", department: "CSE", semester: 2, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
    { code: "GE3251", name: "Engineering Graphics", department: "CSE", semester: 2, credits: 4, lectureHours: 2, practicalHours: 4, category: "Core" },
    { code: "GE3252", name: "English for Engineers", department: "CSE", semester: 2, credits: 2, lectureHours: 2, practicalHours: 0, category: "Core" },
    // CSE Semester 3
    { code: "MA3354", name: "Discrete Mathematics", department: "CSE", semester: 3, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "CS3301", name: "Data Structures", department: "CSE", semester: 3, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
    { code: "CS3302", name: "Digital Principles and Computer Organization", department: "CSE", semester: 3, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "CS3391", name: "Object Oriented Programming", department: "CSE", semester: 3, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
    { code: "CS3381", name: "Data Structures and OOP Lab", department: "CSE", semester: 3, credits: 2, lectureHours: 0, practicalHours: 4, category: "Lab" },
    // CSE Semester 4
    { code: "CS3491", name: "Artificial Intelligence and Machine Learning", department: "CSE", semester: 4, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "CS3492", name: "Database Management Systems", department: "CSE", semester: 4, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
    { code: "CS3451", name: "Introduction to Operating Systems", department: "CSE", semester: 4, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "CS3452", name: "Theory of Computation", department: "CSE", semester: 4, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "CS3481", name: "Database Management Systems Lab", department: "CSE", semester: 4, credits: 2, lectureHours: 0, practicalHours: 4, category: "Lab" },
    // CSE Semester 5
    { code: "CS3591", name: "Computer Networks", department: "CSE", semester: 5, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "CS3592", name: "Software Engineering", department: "CSE", semester: 5, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "CS3501", name: "Compiler Design", department: "CSE", semester: 5, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "CS3581", name: "Networks Lab", department: "CSE", semester: 5, credits: 2, lectureHours: 0, practicalHours: 4, category: "Lab" },
    // ECE Semester 1-4
    { code: "EC3151", name: "Circuit Analysis", department: "ECE", semester: 1, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "EC3251", name: "Signals and Systems", department: "ECE", semester: 2, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "EC3301", name: "Electronic Devices and Circuits", department: "ECE", semester: 3, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
    { code: "EC3391", name: "Digital Electronics", department: "ECE", semester: 3, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "EC3491", name: "Communication Systems", department: "ECE", semester: 4, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    { code: "EC3492", name: "VLSI Design", department: "ECE", semester: 4, credits: 4, lectureHours: 4, practicalHours: 0, category: "Core" },
    // IT
    { code: "IT3301", name: "Data Structures and Algorithms", department: "IT", semester: 3, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
    { code: "IT3491", name: "Web Technologies", department: "IT", semester: 4, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
    { code: "IT3591", name: "Mobile Application Development", department: "IT", semester: 5, credits: 5, lectureHours: 3, practicalHours: 4, category: "Core" },
  ];
  const subjects = await db.insert(schema.subjectsTable).values(subjectData).returning();
  console.log("Subjects seeded:", subjects.length);

  // 3. FACULTY
  const facultyNames = [
    { name: "Dr. Priya Sundaram", employeeId: "FAC001", departmentId: cseDept.id, designation: "Professor", email: "priya.s@college.edu.in", phone: "9876543201" },
    { name: "Mr. Karthik Rajan", employeeId: "FAC002", departmentId: cseDept.id, designation: "Assistant Professor", email: "karthik.r@college.edu.in", phone: "9876543202" },
    { name: "Dr. Anitha Krishnan", employeeId: "FAC003", departmentId: cseDept.id, designation: "Associate Professor", email: "anitha.k@college.edu.in", phone: "9876543203" },
    { name: "Mr. Siva Prakash", employeeId: "FAC004", departmentId: cseDept.id, designation: "Assistant Professor", email: "siva.p@college.edu.in", phone: "9876543204" },
    { name: "Dr. Meena Devi", employeeId: "FAC005", departmentId: cseDept.id, designation: "Assistant Professor", email: "meena.d@college.edu.in", phone: "9876543205" },
    { name: "Dr. Ramesh Babu", employeeId: "FAC006", departmentId: eceDept.id, designation: "Professor", email: "ramesh.b@college.edu.in", phone: "9876543206" },
    { name: "Ms. Kavitha Nair", employeeId: "FAC007", departmentId: eceDept.id, designation: "Assistant Professor", email: "kavitha.n@college.edu.in", phone: "9876543207" },
    { name: "Dr. Suresh Kumar", employeeId: "FAC008", departmentId: mechDept.id, designation: "Professor", email: "suresh.k@college.edu.in", phone: "9876543208" },
    { name: "Ms. Lakshmi Priya", employeeId: "FAC009", departmentId: eeeDept.id, designation: "Assistant Professor", email: "lakshmi.p@college.edu.in", phone: "9876543209" },
    { name: "Dr. Vijay Shankar", employeeId: "FAC010", departmentId: itDept.id, designation: "Associate Professor", email: "vijay.s@college.edu.in", phone: "9876543210" },
  ];
  const faculty = await db.insert(schema.facultyTable).values(facultyNames).returning();
  console.log("Faculty seeded:", faculty.length);

  // 4. USERS (admin + faculty logins + a student login)
  const usersData = [
    { username: "admin", passwordHash: hashPassword("admin123"), role: "admin", name: "System Administrator", email: "admin@college.edu.in" },
    { username: "priya.s", passwordHash: hashPassword("faculty123"), role: "faculty", name: "Dr. Priya Sundaram", email: "priya.s@college.edu.in", departmentId: cseDept.id, facultyId: faculty[0].id },
    { username: "karthik.r", passwordHash: hashPassword("faculty123"), role: "faculty", name: "Mr. Karthik Rajan", email: "karthik.r@college.edu.in", departmentId: cseDept.id, facultyId: faculty[1].id },
    { username: "anitha.k", passwordHash: hashPassword("faculty123"), role: "faculty", name: "Dr. Anitha Krishnan", email: "anitha.k@college.edu.in", departmentId: cseDept.id, facultyId: faculty[2].id },
    { username: "ramesh.b", passwordHash: hashPassword("faculty123"), role: "faculty", name: "Dr. Ramesh Babu", email: "ramesh.b@college.edu.in", departmentId: eceDept.id, facultyId: faculty[5].id },
    { username: "vijay.s", passwordHash: hashPassword("faculty123"), role: "faculty", name: "Dr. Vijay Shankar", email: "vijay.s@college.edu.in", departmentId: itDept.id, facultyId: faculty[9].id },
  ];
  const users = await db.insert(schema.usersTable).values(usersData).returning();
  console.log("Users seeded:", users.length);

  // 5. STUDENTS (40 students across departments)
  const firstNames = ["Arun", "Priya", "Karthik", "Divya", "Rajesh", "Ananya", "Suresh", "Meena", "Vikram", "Kavitha",
    "Siva", "Sneha", "Murugan", "Deepa", "Venkat", "Nithya", "Bala", "Saranya", "Ganesh", "Keerthi",
    "Dinesh", "Pooja", "Ravi", "Uma", "Senthil", "Lakshmi", "Ashwin", "Pavithra", "Gopal", "Revathi",
    "Manoj", "Janani", "Arjun", "Sowmya", "Harish", "Vaishnavi", "Dhinesh", "Charanya", "Naveen", "Ananthi"];
  const lastNames = ["Kumar", "Devi", "Rajan", "Krishnan", "Selvam", "Priya", "Babu", "Nair", "Shankar", "Lakshmi"];

  const studentData: Array<{
    registerNumber: string;
    name: string;
    departmentId: number;
    year: number;
    section: string;
    email: string;
    phone: string;
  }> = [];

  // CSE: 15 students
  for (let i = 0; i < 15; i++) {
    const fn = firstNames[i];
    const ln = lastNames[i % lastNames.length];
    studentData.push({
      registerNumber: `311722104${String(i + 1).padStart(3, "0")}`,
      name: `${fn} ${ln}`,
      departmentId: cseDept.id,
      year: [3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 1, 1, 1, 3, 3][i],
      section: ["A","A","A","A","A","B","B","A","A","B","A","A","B","B","B"][i],
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edu.in`,
      phone: `98765${String(43000 + i).padStart(5, "0")}`,
    });
  }
  // ECE: 10 students
  for (let i = 0; i < 10; i++) {
    const fn = firstNames[i + 15];
    const ln = lastNames[(i + 3) % lastNames.length];
    studentData.push({
      registerNumber: `311722105${String(i + 1).padStart(3, "0")}`,
      name: `${fn} ${ln}`,
      departmentId: eceDept.id,
      year: [3, 3, 2, 2, 4, 4, 1, 1, 3, 2][i],
      section: ["A","A","A","B","A","B","A","A","B","A"][i],
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edu.in`,
      phone: `98765${String(44000 + i).padStart(5, "0")}`,
    });
  }
  // IT: 8 students
  for (let i = 0; i < 8; i++) {
    const fn = firstNames[i + 25];
    const ln = lastNames[(i + 5) % lastNames.length];
    studentData.push({
      registerNumber: `311722113${String(i + 1).padStart(3, "0")}`,
      name: `${fn} ${ln}`,
      departmentId: itDept.id,
      year: [3, 3, 2, 2, 4, 1, 3, 2][i],
      section: ["A","B","A","A","A","A","B","B"][i],
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edu.in`,
      phone: `98765${String(45000 + i).padStart(5, "0")}`,
    });
  }
  // MECH & EEE: 7 students
  for (let i = 0; i < 4; i++) {
    const fn = firstNames[i + 33];
    const ln = lastNames[(i + 7) % lastNames.length];
    studentData.push({
      registerNumber: `311722106${String(i + 1).padStart(3, "0")}`,
      name: `${fn} ${ln}`,
      departmentId: mechDept.id,
      year: [3, 2, 4, 1][i],
      section: ["A","A","A","A"][i],
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edu.in`,
      phone: `98765${String(46000 + i).padStart(5, "0")}`,
    });
  }
  for (let i = 0; i < 3; i++) {
    const fn = firstNames[(i + 37) % firstNames.length];
    const ln = lastNames[(i + 2) % lastNames.length];
    studentData.push({
      registerNumber: `311722107${String(i + 1).padStart(3, "0")}`,
      name: `${fn} ${ln}`,
      departmentId: eeeDept.id,
      year: [3, 2, 4][i],
      section: ["A","A","B"][i],
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edu.in`,
      phone: `98765${String(47000 + i).padStart(5, "0")}`,
    });
  }

  const students = await db.insert(schema.studentsTable).values(studentData).returning();
  console.log("Students seeded:", students.length);

  // Add a student user for login demo
  await db.insert(schema.usersTable).values({
    username: "student1",
    passwordHash: hashPassword("student123"),
    role: "student",
    name: students[0].name,
    email: students[0].email ?? undefined,
    departmentId: cseDept.id,
    studentId: students[0].id,
  });
  console.log("Student user created");

  // 6. TIMETABLE (CSE 3rd year section A)
  const cseSubjects3 = subjects.filter(s => s.department === "CSE" && s.semester === 5);
  const cseSubjects2 = subjects.filter(s => s.department === "CSE" && s.semester === 3);
  const allCseSubjects = [...cseSubjects2, ...cseSubjects3];

  const timetableData = [];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slots = [
    { startTime: "09:00", endTime: "10:00" },
    { startTime: "10:00", endTime: "11:00" },
    { startTime: "11:15", endTime: "12:15" },
    { startTime: "12:15", endTime: "13:15" },
    { startTime: "14:00", endTime: "15:00" },
    { startTime: "15:00", endTime: "16:00" },
  ];
  const rooms = ["CSE-301", "CSE-302", "CSE-Lab-1", "CSE-Lab-2", "Seminar Hall", "CSE-303"];

  for (const day of days) {
    for (let i = 0; i < Math.min(6, allCseSubjects.length); i++) {
      const subj = allCseSubjects[i % allCseSubjects.length];
      const slot = slots[i];
      timetableData.push({
        subjectId: subj.id,
        facultyId: faculty[i % 5].id,
        department: "CSE",
        year: 3,
        section: "A",
        dayOfWeek: day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: rooms[i],
      });
    }
  }
  // ECE timetable
  const eceSubjs = subjects.filter(s => s.department === "ECE");
  for (const day of ["Monday", "Wednesday", "Friday"]) {
    for (let i = 0; i < Math.min(4, eceSubjs.length); i++) {
      timetableData.push({
        subjectId: eceSubjs[i % eceSubjs.length].id,
        facultyId: faculty[5 + (i % 2)].id,
        department: "ECE",
        year: 3,
        section: "A",
        dayOfWeek: day,
        startTime: slots[i].startTime,
        endTime: slots[i].endTime,
        room: "ECE-201",
      });
    }
  }

  await db.insert(schema.timetableTable).values(timetableData);
  console.log("Timetable seeded:", timetableData.length, "entries");

  // 7. ATTENDANCE (past 30 days for all students and a CSE subject)
  const cseMainSubject = allCseSubjects[0];
  const attendanceData: Array<{
    studentId: number;
    subjectId: number;
    date: string;
    status: string;
    method: string;
  }> = [];
  const today = new Date();
  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
    const dateStr = d.toISOString().split("T")[0];

    for (const student of students) {
      // Vary attendance rates: some students have lower attendance
      const rand = Math.random();
      let status: string;
      const isLowAttender = student.id % 5 === 0;
      if (isLowAttender) {
        status = rand < 0.65 ? "present" : rand < 0.75 ? "late" : "absent";
      } else {
        status = rand < 0.82 ? "present" : rand < 0.90 ? "late" : "absent";
      }
      const subj = allCseSubjects[dayOffset % allCseSubjects.length] ?? cseMainSubject;
      attendanceData.push({ studentId: student.id, subjectId: subj.id, date: dateStr, status, method: "manual" });
    }
  }

  // Batch insert attendance (may be large)
  const batchSize = 200;
  for (let i = 0; i < attendanceData.length; i += batchSize) {
    await db.insert(schema.attendanceTable).values(attendanceData.slice(i, i + batchSize));
  }
  console.log("Attendance seeded:", attendanceData.length, "records");

  // 8. ACTIVITIES
  const activitiesData = [
    { title: "LeetCode Daily Challenge", category: "Coding Practice", description: "Solve today's featured problem on LeetCode. Focus on dynamic programming and graph algorithms.", resourceUrl: "https://leetcode.com", difficulty: "Intermediate", estimatedMinutes: 60, isActive: true },
    { title: "HackerRank 30 Days of Code", category: "Coding Practice", description: "Complete the 30 Days of Code challenge on HackerRank and strengthen your programming fundamentals.", resourceUrl: "https://hackerrank.com", difficulty: "Beginner", estimatedMinutes: 45, isActive: true },
    { title: "Aptitude Speed Mathematics", category: "Aptitude Questions", description: "Practice speed arithmetic, percentages, and ratio-proportion problems for campus placements.", resourceUrl: "https://indiabix.com", difficulty: "Intermediate", estimatedMinutes: 30, isActive: true },
    { title: "Logical Reasoning Practice Set", category: "Aptitude Questions", description: "Attempt a timed reasoning test covering syllogisms, coding-decoding, and blood relations.", resourceUrl: "https://indiabix.com/logical-reasoning", difficulty: "Intermediate", estimatedMinutes: 40, isActive: true },
    { title: "Grammar and Vocabulary Builder", category: "English Practice", description: "Improve grammar, vocabulary, and comprehension skills essential for technical interviews.", resourceUrl: "https://grammarly.com", difficulty: "Beginner", estimatedMinutes: 25, isActive: true },
    { title: "Group Discussion Preparation", category: "Communication Skills", description: "Practice group discussion topics related to technology, environment, and current affairs.", resourceUrl: null, difficulty: "Intermediate", estimatedMinutes: 45, isActive: true },
    { title: "Resume Templates and Tips", category: "Resume Building", description: "Create or update your resume using ATS-friendly templates. Highlight projects and achievements.", resourceUrl: "https://resumebuilder.com", difficulty: "Beginner", estimatedMinutes: 60, isActive: true },
    { title: "Mock Interview Practice", category: "Interview Preparation", description: "Simulate HR and technical interviews. Focus on STAR method for behavioral questions.", resourceUrl: "https://pramp.com", difficulty: "Advanced", estimatedMinutes: 60, isActive: true },
    { title: "Build a REST API with Node.js", category: "Mini Projects", description: "Create a simple task management REST API using Node.js, Express, and MongoDB in this guided project.", resourceUrl: "https://youtube.com", difficulty: "Intermediate", estimatedMinutes: 120, isActive: true },
    { title: "Introduction to Machine Learning", category: "AI Learning", description: "Learn ML fundamentals — supervised learning, regression, classification — using scikit-learn.", resourceUrl: "https://coursera.org", difficulty: "Intermediate", estimatedMinutes: 90, isActive: true },
    { title: "Prompt Engineering Basics", category: "AI Learning", description: "Master effective prompting techniques for ChatGPT and other large language models.", resourceUrl: "https://learnprompting.org", difficulty: "Beginner", estimatedMinutes: 45, isActive: true },
    { title: "Build a Portfolio Website", category: "Mini Projects", description: "Create a personal portfolio website using React and Tailwind CSS to showcase your projects.", resourceUrl: "https://github.com", difficulty: "Intermediate", estimatedMinutes: 180, isActive: true },
    { title: "Public Speaking and Presentation Skills", category: "Communication Skills", description: "Practice structured presentations using the PEP (Point, Evidence, Point) technique.", resourceUrl: null, difficulty: "Intermediate", estimatedMinutes: 30, isActive: true },
    { title: "Competitive Programming — Codeforces", category: "Coding Practice", description: "Participate in Codeforces rounds and solve problems in the 800-1200 rating range.", resourceUrl: "https://codeforces.com", difficulty: "Advanced", estimatedMinutes: 90, isActive: true },
    { title: "Data Structures Flashcards", category: "Aptitude Questions", description: "Review key data structures (trees, graphs, heaps) using spaced repetition flashcards.", resourceUrl: "https://anki.com", difficulty: "Intermediate", estimatedMinutes: 20, isActive: true },
    { title: "LinkedIn Profile Optimization", category: "Resume Building", description: "Optimize your LinkedIn profile with a professional photo, compelling summary, and skill endorsements.", resourceUrl: "https://linkedin.com", difficulty: "Beginner", estimatedMinutes: 45, isActive: true },
  ];
  await db.insert(schema.activitiesTable).values(activitiesData);
  console.log("Activities seeded:", activitiesData.length);

  // 9. NOTIFICATIONS
  const notificationsData = [
    { type: "low_attendance", title: "Low Attendance Alert", message: "5 students have attendance below 75%. Immediate action required.", targetRole: "faculty", isRead: false },
    { type: "general", title: "Anna University Exam Schedule", message: "End semester examinations will commence from November 15, 2026. Prepare your students accordingly.", targetRole: "all", isRead: false },
    { type: "timetable_change", title: "Timetable Update - CSE 3A", message: "Data Structures class on Friday has been moved from 10:00 AM to 2:00 PM.", targetRole: "student", isRead: false },
    { type: "assignment", title: "Assignment Deadline Reminder", message: "Database Management Systems assignment due on Monday. Students must submit before 9 AM.", targetRole: "student", isRead: false },
    { type: "new_activity", title: "New Learning Resources Added", message: "15 new activity recommendations have been added including AI Learning and Mini Projects.", targetRole: "all", isRead: true },
    { type: "general", title: "Smart India Hackathon Registration", message: "SIH 2026 registration is now open. Form your teams and register by October 30, 2026.", targetRole: "all", isRead: false },
    { type: "general", title: "Placement Drive - Infosys", message: "Infosys campus recruitment drive on November 5. Eligible: 2026 batch with 7.5+ CGPA.", targetRole: "student", isRead: false },
    { type: "general", title: "Sports Day Notice", message: "Annual Sports Day will be held on October 25. Events registration open at Physical Education Department.", targetRole: "all", isRead: true },
  ];
  await db.insert(schema.notificationsTable).values(notificationsData);
  console.log("Notifications seeded:", notificationsData.length);

  // 10. ACTIVITY LOG
  const activityLogData = [
    { action: "attendance_marked", description: "Bulk attendance marked for CS3591 - Computer Networks (CSE 3A)", userName: "Mr. Karthik Rajan", userRole: "faculty" },
    { action: "student_added", description: "New student Arun Kumar added to CSE Year 3 Section A", userName: "System Administrator", userRole: "admin" },
    { action: "timetable_updated", description: "Timetable updated for CSE 3A — Friday schedule revised", userName: "Dr. Priya Sundaram", userRole: "faculty" },
    { action: "subject_added", description: "New subject 'Machine Learning for Engineers' added to CSE curriculum", userName: "System Administrator", userRole: "admin" },
    { action: "notification_sent", description: "Low attendance alert sent to 5 students and faculty", userName: "System Administrator", userRole: "admin" },
    { action: "attendance_marked", description: "Attendance marked for EC3491 - Communication Systems (ECE 3A)", userName: "Dr. Ramesh Babu", userRole: "faculty" },
    { action: "faculty_added", description: "Dr. Vijay Shankar added to IT Department", userName: "System Administrator", userRole: "admin" },
    { action: "report_generated", description: "Monthly attendance report generated for October 2026", userName: "Dr. Priya Sundaram", userRole: "faculty" },
    { action: "student_updated", description: "Student contact information updated for 3 students", userName: "System Administrator", userRole: "admin" },
    { action: "attendance_marked", description: "QR code attendance session completed for CS3492 - DBMS (CSE 4A)", userName: "Dr. Anitha Krishnan", userRole: "faculty" },
    { action: "activity_added", description: "New activity recommendation added: Build a REST API with Node.js", userName: "System Administrator", userRole: "admin" },
    { action: "login", description: "Admin logged into the system", userName: "System Administrator", userRole: "admin" },
  ];
  await db.insert(schema.activityLogTable).values(activityLogData);
  console.log("Activity log seeded:", activityLogData.length);

  await pool.end();
  console.log("✅ Seeding complete!");
}

seed().catch(async (e) => {
  console.error("Seed failed:", e);
  await pool.end();
  process.exit(1);
});
