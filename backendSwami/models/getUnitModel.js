const mongoose = require('mongoose');
const UnitSchema = require('./UnitModel');

const modelCache = {}; // Optional: avoid re-registering models

const getUnitModel = (dbName, collectionName) => {
  const conn = mongoose.connection.useDb(dbName);

  const modelName = `Unit_${collectionName}`;

  if (!modelCache[modelName]) {
    modelCache[modelName] = conn.model(modelName, UnitSchema, collectionName);
  }

  return modelCache[modelName];
};

module.exports = getUnitModel;
