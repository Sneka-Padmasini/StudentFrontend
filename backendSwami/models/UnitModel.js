const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: String,
  explanation: String,
  option1: String,
  option2: String,
  option3: String,
  option4: String,
  answer: String
});

const testSchema = new mongoose.Schema({
  testName: String,
  marks: String,
  timeLimit: String,
  questionsList: [questionSchema]
});

const UnitSchema = new mongoose.Schema({
  unitName: String,
  standard: String,
  parentId: String,
  explanation: String,
  audioFileId: [String],
  test: [testSchema],
  units: [] // placeholder for recursion
});

// recursion
UnitSchema.add({ units: [UnitSchema] });

// ❌ REMOVE this
// module.exports = mongoose.model('Unit', UnitSchema);

// ✅ EXPORT ONLY SCHEMA
module.exports = UnitSchema;
