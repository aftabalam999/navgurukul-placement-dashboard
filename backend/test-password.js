const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testEmail = process.argv[2] || 'manager@placement.edu';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_dashboard')
  .then(async () => {
    const User = require('./models/User');
    const user = await User.findOne({ email: testEmail });
    
    if (user) {
      console.log('User found:', user.email);
      console.log('Role:', user.role);
      console.log('isActive:', user.isActive);
      console.log('Password hash exists:', !!user.password);
      console.log('Password hash length:', user.password?.length);
      
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('Password matches:', isMatch);
      
      if (!isMatch) {
        console.log('\n⚠️  Password not matching!');
      } else {
        console.log('\n✅ Password is correct!');
      }
    } else {
      console.log('User not found:', testEmail);
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
