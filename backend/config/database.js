const { createClient } = require('@supabase/supabase-js');
const logger = require('../services/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
  try {
    // Test the connection by making a simple query
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('Supabase connection test failed:', error);
      throw error;
    }

    logger.info('Supabase Connected Successfully');

    return supabase;
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { connectDB, supabase };