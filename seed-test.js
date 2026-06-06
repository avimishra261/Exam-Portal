const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) {
    console.log("No student found. Please register one.");
    return;
  }
  
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  const now = new Date();
  const startTime = new Date(now.getTime() - 1000 * 60 * 60 * 24); // Started yesterday
  const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // Ends in 7 days
  
  const exam = await prisma.exam.create({
    data: {
      title: "GATE Mock Test 1 - Computer Science",
      description: "Full length mock test for GATE CS.",
      durationMinutes: 180,
      startTime: startTime,
      endTime: endTime,
      isDraft: false,
      questions: {
        create: [
          {
            text: "Which of the following is a non-linear data structure?",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "Array", isCorrect: false },
                { text: "Linked List", isCorrect: false },
                { text: "Tree", isCorrect: true },
                { text: "Stack", isCorrect: false },
              ]
            }
          },
          {
            text: "Which of these are valid HTTP methods?",
            type: "MSQ",
            maxMarks: 2,
            options: {
              create: [
                { text: "GET", isCorrect: true },
                { text: "POST", isCorrect: true },
                { text: "FETCH", isCorrect: false },
                { text: "PUSH", isCorrect: false },
              ]
            }
          },
          {
            text: "If a processor clock is 2 GHz, what is the clock cycle time in nanoseconds? (Enter numeric value only)",
            type: "NAT",
            maxMarks: 2,
            correctNumeric: 0.5
          },
          {
            text: "Explain the difference between TCP and UDP.",
            type: "DESCRIPTIVE",
            maxMarks: 5,
          }
        ]
      }
    }
  });

  console.log("Created Test: " + exam.title);
  console.log("Student Email: " + student.email);
  if (admin) {
    console.log("Admin Email: " + admin.email);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
