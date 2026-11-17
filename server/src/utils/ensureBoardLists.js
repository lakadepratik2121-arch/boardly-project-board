import BoardList from '../models/BoardList.js'
import Task from '../models/Task.js'

const defaults = [
  { title: 'To do', status: 'todo' },
  { title: 'In progress', status: 'in-progress' },
  { title: 'Done', status: 'done' },
]

export default async function ensureBoardLists(boardId) {
  const existing = await BoardList.find({ board: boardId }).sort({ position: 1 })
  if (!existing.length) {
    const created = await Promise.allSettled(defaults.map((list, position) => BoardList.updateOne(
      { board: boardId, systemKey: list.status },
      { $setOnInsert: { ...list, systemKey: list.status, position, board: boardId } },
      { upsert: true },
    )))
    const unexpected = created.find((result) => result.status === 'rejected' && result.reason?.code !== 11000)
    if (unexpected) throw unexpected.reason
    const listsToMigrate = await BoardList.find({ board: boardId, systemKey: { $exists: true } })
    for (const list of listsToMigrate) await Task.updateMany({ board: boardId, status: list.status, $or: [{ list: null }, { list: { $exists: false } }] }, { $set: { list: list._id } })
  }
  const lists = await BoardList.find({ board: boardId }).sort({ position: 1 })
  return lists
}
