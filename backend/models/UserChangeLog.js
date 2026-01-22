const mongoose = require('mongoose');

const userChangeLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changeType: { type: String, required: true }, // e.g., 'profile_update', 'readiness_change', 'role_change'
  fieldChanges: [{ path: String, oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed }],
  note: String
}, { timestamps: true });

module.exports = mongoose.model('UserChangeLog', userChangeLogSchema);
