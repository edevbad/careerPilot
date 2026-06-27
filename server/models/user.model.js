const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select : false
  },
  role : {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  }
},{timestamps: true});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    throw new Error('Password is not modified');
  }
  try{
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  catch(err){
    throw new Error('Error hashing password');
  }
});
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;