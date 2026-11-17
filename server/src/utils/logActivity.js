import Activity from '../models/Activity.js'

export default async function logActivity(entry) {
  try {
    await Activity.create(entry)
  } catch (error) {
    console.error('Could not save board activity:', error.message)
  }
}
