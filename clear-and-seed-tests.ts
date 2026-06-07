import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing exams (cascade will delete questions, options, submissions)
  await prisma.exam.deleteMany({});
  console.log("Deleted all existing exams.");

  const now = new Date();

  // Test 1: Mathematics
  await prisma.exam.create({
    data: {
      title: "Demo Mathematics Test",
      description: "A demo test for Mathematics.",
      durationMinutes: 60,
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      isDraft: false,
      fullscreenChances: 3,
      maxAttempts: 2,
      questions: {
        create: [
          {
            text: "What is 2 + 2?",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "3", isCorrect: false },
                { text: "4", isCorrect: true },
                { text: "5", isCorrect: false },
              ]
            }
          },
          {
            text: "Solve for x: 2x = 10",
            type: "NAT",
            maxMarks: 2,
            correctNumeric: 5
          }
        ]
      }
    }
  });

  // Test 2: Science
  await prisma.exam.create({
    data: {
      title: "Demo Science Test",
      description: "A demo test for Science.",
      durationMinutes: 45,
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      isDraft: false,
      fullscreenChances: 3,
      maxAttempts: 1,
      questions: {
        create: [
          {
            text: "What is the chemical symbol for water?",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "H2O", isCorrect: true },
                { text: "CO2", isCorrect: false },
                { text: "O2", isCorrect: false },
              ]
            }
          }
        ]
      }
    }
  });

  // Test 3: English
  await prisma.exam.create({
    data: {
      title: "Demo English Test",
      description: "A demo test for English grammar.",
      durationMinutes: 30,
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      isDraft: false,
      maxAttempts: 3,
      questions: {
        create: [
          {
            text: "Choose the correct spelling:",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "Accomodation", isCorrect: false },
                { text: "Accommodation", isCorrect: true },
                { text: "Acommodation", isCorrect: false },
              ]
            }
          }
        ]
      }
    }
  });

  // Test 4: History
  await prisma.exam.create({
    data: {
      title: "Demo History Test",
      description: "A demo test for History (Upcoming).",
      durationMinutes: 90,
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      isDraft: false,
      questions: {
        create: [
          {
            text: "Who was the first President of the United States?",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "Abraham Lincoln", isCorrect: false },
                { text: "George Washington", isCorrect: true },
                { text: "Thomas Jefferson", isCorrect: false },
              ]
            }
          }
        ]
      }
    }
  });

  // Test 5: Geography
  await prisma.exam.create({
    data: {
      title: "Demo Geography Test",
      description: "A demo test for Geography (Missed).",
      durationMinutes: 60,
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
      endTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1),
      isDraft: false,
      questions: {
        create: [
          {
            text: "What is the capital of France?",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "London", isCorrect: false },
                { text: "Berlin", isCorrect: false },
                { text: "Paris", isCorrect: true },
              ]
            }
          }
        ]
      }
    }
  });

  // Test 6: Computer Science
  await prisma.exam.create({
    data: {
      title: "Demo Computer Science Test",
      description: "A demo test for Computer Science.",
      durationMinutes: 120,
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      isDraft: false,
      questions: {
        create: [
          {
            text: "Which of these is a valid JavaScript framework?",
            type: "MCQ",
            maxMarks: 1,
            options: {
              create: [
                { text: "React", isCorrect: true },
                { text: "Django", isCorrect: false },
                { text: "Laravel", isCorrect: false },
              ]
            }
          }
        ]
      }
    }
  });

  console.log("Created 6 demo test papers successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
