import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.error('No admin user found to assign the tests to.');
    return;
  }

  // Create Test 1: Computer Science
  const test1 = await prisma.exam.create({
    data: {
      title: 'GATE 2026 - Computer Science (Mock)',
      description: 'A mock test for Computer Science with typical GATE style questions.',
      durationMinutes: 180,
      maxAttempts: 1,
      createdById: adminUser.id,
      questions: {
        create: [
          {
            text: 'Which of the following sorting algorithms has the lowest worst-case time complexity?',
            type: 'MCQ',
            maxMarks: 1,
            options: {
              create: [
                { text: 'Merge Sort', isCorrect: true },
                { text: 'Quick Sort', isCorrect: false },
                { text: 'Bubble Sort', isCorrect: false },
                { text: 'Insertion Sort', isCorrect: false },
              ]
            }
          },
          {
            text: 'Consider the following C code segment. What will be the output?\n\nint a = 5, b = 10;\na = a ^ b;\nb = a ^ b;\na = a ^ b;\nprintf("%d %d", a, b);',
            type: 'NAT',
            maxMarks: 2,
            correctNumeric: 10,
          },
          {
            text: 'Which of the following are properties of a Binary Search Tree (BST)?',
            type: 'MSQ',
            maxMarks: 2,
            options: {
              create: [
                { text: 'Inorder traversal gives sorted elements', isCorrect: true },
                { text: 'The left subtree contains only nodes with keys less than the node\'s key', isCorrect: true },
                { text: 'It must be completely balanced', isCorrect: false },
                { text: 'Worst case search time is O(log n)', isCorrect: false },
              ]
            }
          }
        ]
      }
    }
  });

  // Create Test 2: General Aptitude
  const test2 = await prisma.exam.create({
    data: {
      title: 'GATE 2026 - General Aptitude (Mock)',
      description: 'A mock test focusing on the General Aptitude section of GATE.',
      durationMinutes: 60,
      maxAttempts: 2,
      createdById: adminUser.id,
      questions: {
        create: [
          {
            text: 'If A is brother of B, C is father of A, D is brother of E, and E is daughter of B. Then, uncle of D is?',
            type: 'MCQ',
            maxMarks: 1,
            options: {
              create: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: false },
                { text: 'C', isCorrect: false },
                { text: 'None of these', isCorrect: false },
              ]
            }
          },
          {
            text: 'A pipe can fill a tank in 10 hours. Another pipe can empty the full tank in 15 hours. If both pipes are opened together, how many hours will it take to fill the tank?',
            type: 'NAT',
            maxMarks: 2,
            correctNumeric: 30,
          }
        ]
      }
    }
  });

  console.log(`Successfully created two tests: \n1. ${test1.title}\n2. ${test2.title}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
