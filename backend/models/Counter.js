const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});

counterSchema.statics.getNextId = async function(name) {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
