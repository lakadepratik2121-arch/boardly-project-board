import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
      default: 'Boardly user',
      maxlength: 60,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    targetType: {
      type: String,
      enum: ['Task'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
  },
  { timestamps: true },
)

const Activity = mongoose.model('Activity', activitySchema)

export default Activity
