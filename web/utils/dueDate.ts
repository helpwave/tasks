export const DueDateUtils = {
  isOverdue: (dueDate: Date | undefined | null, done: boolean): boolean => {
    if (!dueDate || done) return false
    return new Date(dueDate).getTime() < Date.now()
  },
  isCloseToDueDate: (dueDate: Date | undefined | null, done: boolean): boolean => {
    if (!dueDate || done) return false
    const now = Date.now()
    const dueTime = new Date(dueDate).getTime()
    const oneHour = 60 * 60 * 1000
    return dueTime > now && dueTime - now <= oneHour
  }
}