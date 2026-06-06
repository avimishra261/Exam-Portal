const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) {
    console.log("No student found. Please register one.");
    return;
  }
  
  const now = new Date();

  // Test 2: Active Test (Starts yesterday, Ends tomorrow)
  await prisma.exam.create({
    data: {
      title: "GATE Mock Test 2 - Electrical Engineering",
      description: "Active test for Electrical branch.",
      durationMinutes: 120,
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24),
      isDraft: false,
      fullscreenChances: 3,
      maxAttempts: 2,
      questions: {
        create: [
          {
            text: "Ohm's law is applicable to...",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "Semiconductors", isCorrect: false },
                { text: "Vacuum tubes", isCorrect: false },
                { text: "Electrolytes", isCorrect: false },
                { text: "Metallic conductors", isCorrect: true },
              ]
            }
          },
          {
            text: "What is the unit of capacitance? (Descriptive)",
            type: "DESCRIPTIVE",
            maxMarks: 2,
          }
        ]
      }
    }
  });
  console.log("Created Test 2 (Active)");

  // Test 3: Upcoming Test (Starts tomorrow, Ends next week)
  await prisma.exam.create({
    data: {
      title: "GATE Mock Test 3 - Mechanical Engineering",
      description: "Upcoming test. Not accessible yet.",
      durationMinutes: 180,
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      isDraft: false,
      questions: {
        create: [
          {
            text: "Which of the following is an intensive property?",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "Volume", isCorrect: false },
                { text: "Mass", isCorrect: false },
                { text: "Temperature", isCorrect: true },
                { text: "Energy", isCorrect: false },
              ]
            }
          }
        ]
      }
    }
  });
  console.log("Created Test 3 (Upcoming)");

  // Test 4: Missed Test (Starts 5 days ago, Ends yesterday)
  await prisma.exam.create({
    data: {
      title: "GATE Mock Test 4 - Civil Engineering",
      description: "Missed test. You cannot take this test anymore.",
      durationMinutes: 90,
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
      endTime: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      isDraft: false,
      questions: {
        create: [
          {
            text: "The standard size of a brick is...",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "19x9x9 cm", isCorrect: true },
                { text: "20x10x10 cm", isCorrect: false },
                { text: "21x11x11 cm", isCorrect: false },
                { text: "22x12x12 cm", isCorrect: false },
              ]
            }
          }
        ]
      }
    }
  });
  console.log("Created Test 4 (Missed)");

  // Test 5: Another Active Test
  await prisma.exam.create({
    data: {
      title: "GATE Mock Test 5 - Mathematics",
      description: "General aptitude and mathematics active test.",
      durationMinutes: 60,
      startTime: new Date(now.getTime() - 1000 * 60 * 60),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 48),
      isDraft: false,
      fullscreenChances: 5,
      questions: {
        create: [
          {
            text: "What is the integral of 2x?",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "x^2", isCorrect: true },
                { text: "2x^2", isCorrect: false },
                { text: "2", isCorrect: false },
                { text: "x", isCorrect: false },
              ]
            }
          },
          {
            text: "Evaluate: 5 + 7 * 2",
            type: "NAT",
            maxMarks: 2,
            correctNumeric: 19
          }
        ]
      }
    }
  });
  console.log("Created Test 5 (Active)");

  console.log("Database seeded successfully with multiple tests!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
