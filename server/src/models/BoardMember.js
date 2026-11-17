import mongoose from 'mongoose'

const boardMemberSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  invitedEmail: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['member'], default: 'member' },
  status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviteCodeHash: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  joinedAt: { type: Date, default: null },
}, { timestamps: true })

boardMemberSchema.index({ board: 1, invitedEmail: 1 }, { unique: true })
export default mongoose.model('BoardMember', boardMemberSchema)
