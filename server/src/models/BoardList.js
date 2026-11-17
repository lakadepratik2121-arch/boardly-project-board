import mongoose from 'mongoose'

const boardListSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 60 },
  position: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  systemKey: { type: String, enum: ['todo', 'in-progress', 'done'], default: undefined },
}, { timestamps: true })

boardListSchema.index({ board: 1, systemKey: 1 }, { unique: true, partialFilterExpression: { systemKey: { $exists: true } } })

export default mongoose.model('BoardList', boardListSchema)
