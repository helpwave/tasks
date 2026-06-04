// A "date only" due date (no time-of-day selected) is represented by fixing the time
// component to the end of the day (23:59:59.999). This matches the sentinel used by
// hightide's FlexibleDateTimeInput and lets us render such due dates without a
// meaningless time component.
const DATE_ONLY_HOURS = 23
const DATE_ONLY_MINUTES = 59
const DATE_ONLY_SECONDS = 59
const DATE_ONLY_MILLISECONDS = 999

export const DueDateUtils = {
  isDateOnly: (dueDate: Date | string | undefined | null): boolean => {
    if (!dueDate) return false
    const date = new Date(dueDate)
    if (Number.isNaN(date.getTime())) return false
    return date.getHours() === DATE_ONLY_HOURS
      && date.getMinutes() === DATE_ONLY_MINUTES
      && date.getSeconds() === DATE_ONLY_SECONDS
      && date.getMilliseconds() === DATE_ONLY_MILLISECONDS
  },
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
