require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Prize = require('../models/Prize');
const logger = require('../services/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brain_teaser_quiz');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Sample questions for different categories
const sampleQuestions = [
  // General Knowledge
  {
    question: "What is the capital city of Nigeria?",
    options: [
      { text: "Lagos", isCorrect: false },
      { text: "Abuja", isCorrect: true },
      { text: "Kano", isCorrect: false },
      { text: "Port Harcourt", isCorrect: false }
    ],
    correctAnswer: "Abuja",
    explanation: "Abuja has been the capital of Nigeria since 1991, replacing Lagos.",
    category: "general_knowledge",
    difficulty: "easy",
    points: 10,
    country: "Nigeria"
  },
  {
    question: "Which is the largest continent in the world?",
    options: [
      { text: "Africa", isCorrect: false },
      { text: "Asia", isCorrect: true },
      { text: "North America", isCorrect: false },
      { text: "Europe", isCorrect: false }
    ],
    correctAnswer: "Asia",
    explanation: "Asia is the largest continent by both area and population.",
    category: "general_knowledge",
    difficulty: "easy",
    points: 10
  },
  {
    question: "What is the smallest planet in our solar system?",
    options: [
      { text: "Mars", isCorrect: false },
      { text: "Venus", isCorrect: false },
      { text: "Mercury", isCorrect: true },
      { text: "Pluto", isCorrect: false }
    ],
    correctAnswer: "Mercury",
    explanation: "Mercury is the smallest planet in our solar system and closest to the Sun.",
    category: "science",
    difficulty: "medium",
    points: 15
  },

  // History
  {
    question: "In which year did Nigeria gain independence?",
    options: [
      { text: "1958", isCorrect: false },
      { text: "1960", isCorrect: true },
      { text: "1962", isCorrect: false },
      { text: "1963", isCorrect: false }
    ],
    correctAnswer: "1960",
    explanation: "Nigeria gained independence from British colonial rule on October 1, 1960.",
    category: "history",
    difficulty: "easy",
    points: 10,
    country: "Nigeria"
  },
  {
    question: "Who was the first military Head of State of Nigeria?",
    options: [
      { text: "Yakubu Gowon", isCorrect: false },
      { text: "Johnson Aguiyi-Ironsi", isCorrect: true },
      { text: "Murtala Mohammed", isCorrect: false },
      { text: "Olusegun Obasanjo", isCorrect: false }
    ],
    correctAnswer: "Johnson Aguiyi-Ironsi",
    explanation: "Major General Johnson Aguiyi-Ironsi became Nigeria's first military Head of State after the 1966 coup.",
    category: "history",
    difficulty: "medium",
    points: 15,
    country: "Nigeria"
  },
  {
    question: "Which ancient wonder of the world was located in Egypt?",
    options: [
      { text: "Hanging Gardens of Babylon", isCorrect: false },
      { text: "Colossus of Rhodes", isCorrect: false },
      { text: "Great Pyramid of Giza", isCorrect: true },
      { text: "Lighthouse of Alexandria", isCorrect: false }
    ],
    correctAnswer: "Great Pyramid of Giza",
    explanation: "The Great Pyramid of Giza is the only surviving ancient wonder of the world.",
    category: "history",
    difficulty: "medium",
    points: 15
  },

  // Current Affairs
  {
    question: "Who is the current President of Nigeria (as of 2024)?",
    options: [
      { text: "Muhammadu Buhari", isCorrect: false },
      { text: "Bola Ahmed Tinubu", isCorrect: true },
      { text: "Atiku Abubakar", isCorrect: false },
      { text: "Peter Obi", isCorrect: false }
    ],
    correctAnswer: "Bola Ahmed Tinubu",
    explanation: "Bola Ahmed Tinubu became Nigeria's President in May 2023.",
    category: "current_affairs",
    difficulty: "easy",
    points: 10,
    country: "Nigeria"
  },
  {
    question: "Which technology company owns WhatsApp?",
    options: [
      { text: "Google", isCorrect: false },
      { text: "Meta (Facebook)", isCorrect: true },
      { text: "Microsoft", isCorrect: false },
      { text: "Twitter", isCorrect: false }
    ],
    correctAnswer: "Meta (Facebook)",
    explanation: "Meta (formerly Facebook) acquired WhatsApp in 2014 for $19 billion.",
    category: "current_affairs",
    difficulty: "easy",
    points: 10
  },

  // Science
  {
    question: "What is the chemical symbol for gold?",
    options: [
      { text: "Go", isCorrect: false },
      { text: "Au", isCorrect: true },
      { text: "Ag", isCorrect: false },
      { text: "Gd", isCorrect: false }
    ],
    correctAnswer: "Au",
    explanation: "Au comes from the Latin word 'aurum' meaning gold.",
    category: "science",
    difficulty: "medium",
    points: 15
  },
  {
    question: "How many chambers does a human heart have?",
    options: [
      { text: "2", isCorrect: false },
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: true },
      { text: "5", isCorrect: false }
    ],
    correctAnswer: "4",
    explanation: "The human heart has four chambers: two atria and two ventricles.",
    category: "science",
    difficulty: "easy",
    points: 10
  },

  // Sports
  {
    question: "Which Nigerian footballer is known as 'Jay-Jay'?",
    options: [
      { text: "Nwankwo Kanu", isCorrect: false },
      { text: "Austin Okocha", isCorrect: true },
      { text: "Finidi George", isCorrect: false },
      { text: "Rashidi Yekini", isCorrect: false }
    ],
    correctAnswer: "Austin Okocha",
    explanation: "Austin 'Jay-Jay' Okocha was famous for his skills and creativity on the football field.",
    category: "sports",
    difficulty: "easy",
    points: 10,
    country: "Nigeria"
  },
  {
    question: "How many players are on a basketball team on the court at one time?",
    options: [
      { text: "4", isCorrect: false },
      { text: "5", isCorrect: true },
      { text: "6", isCorrect: false },
      { text: "7", isCorrect: false }
    ],
    correctAnswer: "5",
    explanation: "Each basketball team has 5 players on the court at any given time.",
    category: "sports",
    difficulty: "easy",
    points: 10
  },

  // Entertainment
  {
    question: "Which Nollywood actress is known as 'Mama G'?",
    options: [
      { text: "Genevieve Nnaji", isCorrect: false },
      { text: "Patience Ozokwo", isCorrect: true },
      { text: "Omotola Jalade", isCorrect: false },
      { text: "Rita Dominic", isCorrect: false }
    ],
    correctAnswer: "Patience Ozokwo",
    explanation: "Patience Ozokwo is popularly known as 'Mama G' in Nollywood movies.",
    category: "entertainment",
    difficulty: "easy",
    points: 10,
    country: "Nigeria"
  },
  {
    question: "Which streaming platform produced the series 'Stranger Things'?",
    options: [
      { text: "HBO", isCorrect: false },
      { text: "Netflix", isCorrect: true },
      { text: "Amazon Prime", isCorrect: false },
      { text: "Disney+", isCorrect: false }
    ],
    correctAnswer: "Netflix",
    explanation: "Stranger Things is a Netflix original series that premiered in 2016.",
    category: "entertainment",
    difficulty: "easy",
    points: 10
  }
];

// Sample prizes
const samplePrizes = [
  {
    name: "Daily Cash Prize - ₦5,000",
    description: "Win ₦5,000 cash for scoring 80% or above",
    value: 5000,
    currency: "NGN",
    type: "cash",
    category: "daily",
    minimumScore: 80,
    minimumQuestions: 8,
    totalQuantity: 5,
    remainingQuantity: 5,
    distributionTime: "18:00",
    distributionDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    claimInstructions: "Contact customer service with your claim code to receive cash prize",
    termsAndConditions: "Prize must be claimed within 7 days. Valid ID required.",
    sponsor: {
      name: "Brain Teaser Quiz",
      contact: "support@brainquiz.com"
    },
    priority: 5
  },
  {
    name: "MTN Airtime - ₦1,000",
    description: "₦1,000 airtime for any MTN number",
    value: 1000,
    currency: "NGN",
    type: "airtime",
    category: "daily",
    minimumScore: 70,
    minimumQuestions: 5,
    totalQuantity: 20,
    remainingQuantity: 20,
    distributionTime: "18:00",
    distributionDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    claimInstructions: "Airtime will be sent to your registered phone number within 24 hours",
    termsAndConditions: "Valid for MTN numbers only. One prize per day per user.",
    sponsor: {
      name: "MTN Nigeria",
      contact: "180"
    },
    priority: 3
  },
  {
    name: "Data Bundle - 1GB",
    description: "1GB data bundle for 30 days",
    value: 500,
    currency: "NGN",
    type: "data",
    category: "daily",
    minimumScore: 60,
    minimumQuestions: 5,
    totalQuantity: 50,
    remainingQuantity: 50,
    distributionTime: "18:00",
    distributionDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    claimInstructions: "Data will be credited to your number within 4 hours",
    termsAndConditions: "Valid for 30 days from activation. Works on all networks.",
    sponsor: {
      name: "Brain Teaser Quiz",
      contact: "support@brainquiz.com"
    },
    priority: 2
  },
  {
    name: "Weekly Mega Prize - ₦50,000",
    description: "Win ₦50,000 for being the top scorer of the week",
    value: 50000,
    currency: "NGN",
    type: "cash",
    category: "weekly",
    minimumScore: 90,
    minimumQuestions: 50,
    totalQuantity: 1,
    remainingQuantity: 1,
    distributionTime: "18:00",
    distributionDays: ["sunday"],
    claimInstructions: "Winner will be contacted directly. Bank details required for transfer.",
    termsAndConditions: "Must be top scorer for the week. Ties broken by fastest completion time.",
    sponsor: {
      name: "Brain Teaser Quiz",
      contact: "support@brainquiz.com"
    },
    priority: 10
  },
  {
    name: "Consolation Prize - ₦200 Airtime",
    description: "₦200 airtime for participating players",
    value: 200,
    currency: "NGN",
    type: "airtime",
    category: "consolation",
    minimumScore: 30,
    minimumQuestions: 3,
    totalQuantity: 100,
    remainingQuantity: 100,
    distributionTime: "20:00",
    distributionDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    claimInstructions: "Airtime sent automatically to qualified participants",
    termsAndConditions: "For participants who don't win main prizes. Limited to 3 per week per user.",
    sponsor: {
      name: "Brain Teaser Quiz",
      contact: "support@brainquiz.com"
    },
    priority: 1
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await Question.deleteMany({});
    await Prize.deleteMany({});

    // Seed questions
    console.log('Seeding questions...');
    const createdQuestions = await Question.insertMany(sampleQuestions);
    console.log(`✅ Created ${createdQuestions.length} questions`);

    // Seed prizes
    console.log('Seeding prizes...');
    const createdPrizes = await Prize.insertMany(samplePrizes);
    console.log(`✅ Created ${createdPrizes.length} prizes`);

    // Log summary
    console.log('\n📊 Database Seeding Summary:');
    console.log(`Questions by category:`);
    const questionsByCategory = await Question.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    questionsByCategory.forEach(cat => {
      console.log(`  - ${cat._id}: ${cat.count} questions`);
    });

    console.log(`\nQuestions by difficulty:`);
    const questionsByDifficulty = await Question.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    questionsByDifficulty.forEach(diff => {
      console.log(`  - ${diff._id}: ${diff.count} questions`);
    });

    console.log(`\nPrizes by category:`);
    const prizesByCategory = await Prize.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: '$value' } } },
      { $sort: { _id: 1 } }
    ]);
    prizesByCategory.forEach(cat => {
      console.log(`  - ${cat._id}: ${cat.count} prizes (₦${cat.totalValue.toLocaleString()})`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('🚀 Your Brain Teaser Quiz server is ready with sample data.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleQuestions, samplePrizes };