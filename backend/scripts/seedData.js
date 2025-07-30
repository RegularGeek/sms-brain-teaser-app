require('dotenv').config();
const { supabase } = require('../config/database');

const sampleQuestions = [
  {
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct_answer: "Paris",
    explanation: "Paris is the capital and largest city of France.",
    category: "general_knowledge",
    difficulty_level: "easy",
    points: 10
  },
  {
    text: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct_answer: "Mars",
    explanation: "Mars is called the Red Planet due to its reddish appearance.",
    category: "science",
    difficulty_level: "easy",
    points: 10
  },
  {
    text: "Who was the first President of the United States?",
    options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
    correct_answer: "George Washington",
    explanation: "George Washington served as the first President from 1789 to 1797.",
    category: "history",
    difficulty_level: "medium",
    points: 15
  },
  {
    text: "What year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correct_answer: "1945",
    explanation: "World War II ended in 1945 with the surrender of Germany and Japan.",
    category: "history",
    difficulty_level: "medium",
    points: 15
  },
  {
    text: "Which element has the chemical symbol 'O'?",
    options: ["Oxygen", "Osmium", "Oganesson", "Osmium"],
    correct_answer: "Oxygen",
    explanation: "Oxygen has the chemical symbol 'O' and atomic number 8.",
    category: "science",
    difficulty_level: "easy",
    points: 10
  },
  {
    text: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correct_answer: "Pacific Ocean",
    explanation: "The Pacific Ocean is the largest and deepest ocean on Earth.",
    category: "general_knowledge",
    difficulty_level: "easy",
    points: 10
  },
  {
    text: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correct_answer: "William Shakespeare",
    explanation: "William Shakespeare wrote the famous tragedy 'Romeo and Juliet'.",
    category: "entertainment",
    difficulty_level: "medium",
    points: 15
  },
  {
    text: "What is the currency of Japan?",
    options: ["Yen", "Won", "Yuan", "Ringgit"],
    correct_answer: "Yen",
    explanation: "The Japanese Yen (¥) is the official currency of Japan.",
    category: "general_knowledge",
    difficulty_level: "easy",
    points: 10
  },
  {
    text: "Which country won the FIFA World Cup in 2018?",
    options: ["Brazil", "Germany", "France", "Argentina"],
    correct_answer: "France",
    explanation: "France won the 2018 FIFA World Cup by defeating Croatia 4-2.",
    category: "sports",
    difficulty_level: "medium",
    points: 15
  },
  {
    text: "What is the chemical formula for water?",
    options: ["H2O", "CO2", "NaCl", "O2"],
    correct_answer: "H2O",
    explanation: "Water has the chemical formula H2O, consisting of two hydrogen atoms and one oxygen atom.",
    category: "science",
    difficulty_level: "easy",
    points: 10
  }
];

const samplePrizes = [
  {
    name: "Gift Card",
    description: "A $50 gift card to your favorite store",
    value: 50.00,
    category: "digital",
    minimum_score: 70,
    quantity_available: 100,
    quantity_claimed: 0
  },
  {
    name: "Premium Subscription",
    description: "3 months of premium quiz access",
    value: 30.00,
    category: "subscription",
    minimum_score: 80,
    quantity_available: 50,
    quantity_claimed: 0
  },
  {
    name: "Merchandise",
    description: "Brain Teaser Quiz branded merchandise",
    value: 25.00,
    category: "physical",
    minimum_score: 75,
    quantity_available: 75,
    quantity_claimed: 0
  },
  {
    name: "Cash Prize",
    description: "Direct cash transfer of $100",
    value: 100.00,
    category: "cash",
    minimum_score: 90,
    quantity_available: 10,
    quantity_claimed: 0
  }
];

async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Check if data already exists
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('id')
      .limit(1);

    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Data already exists. Skipping seeding.');
      return;
    }

    // Insert questions
    console.log('Inserting questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .insert(sampleQuestions)
      .select();

    if (questionsError) {
      console.error('Error inserting questions:', questionsError);
      return;
    }

    console.log(`Inserted ${questions.length} questions`);

    // Insert prizes
    console.log('Inserting prizes...');
    const { data: prizes, error: prizesError } = await supabase
      .from('prizes')
      .insert(samplePrizes)
      .select();

    if (prizesError) {
      console.error('Error inserting prizes:', prizesError);
      return;
    }

    console.log(`Inserted ${prizes.length} prizes`);

    console.log('Data seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

// Run the seeding
seedData();