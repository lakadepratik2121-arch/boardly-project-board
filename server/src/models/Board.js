import mongoose from 'mongoose'

const boardSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'A board title is required.'],
      trim: true,
      maxlength: [100, 'A board title can be at most 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'A board description can be at most 500 characters.'],
    },
  },
  { timestamps: true },
)

const Board = mongoose.model('Board', boardSchema)

export default Board
