import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [60, 'A commenter name can be at most 60 characters.'],
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'A comment can be at most 1000 characters.'],
    },
  },
  { timestamps: true },
)

const Comment = mongoose.model('Comment', commentSchema)

export default Comment
