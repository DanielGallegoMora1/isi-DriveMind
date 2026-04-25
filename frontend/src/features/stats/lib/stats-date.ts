const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const NAIVE_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

export function parseStatsDate(value: string) {
  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0, 0)
  }

  if (NAIVE_DATETIME_PATTERN.test(value)) {
    return new Date(`${value}Z`)
  }

  return new Date(value)
}
