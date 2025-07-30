const { supabase } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async findByPhone(phone) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(options = {}) {
    try {
      let query = supabase
        .from('users')
        .select('*');

      // Add pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Add sorting
      if (options.sortBy) {
        query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async count() {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count;
    } catch (error) {
      throw error;
    }
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  static async updateLastLogin(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async updateQuizStats(id, stats) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          total_quizzes_taken: stats.totalQuizzesTaken,
          total_score: stats.totalScore,
          average_score: stats.averageScore,
          highest_score: stats.highestScore,
          last_quiz_date: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;