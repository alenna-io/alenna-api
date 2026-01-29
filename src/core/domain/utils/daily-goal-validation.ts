export function validateDailyGoalText(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();

  if (trimmed === '') {
    return { valid: false, error: 'Daily goal text cannot be empty' };
  }

  const lowerText = trimmed.toLowerCase();

  const specialWords = ['st', 'self test', 'test', 't'];
  if (specialWords.includes(lowerText)) {
    return { valid: true };
  }

  const singleNumberPattern = /^\d+$/;
  if (singleNumberPattern.test(trimmed)) {
    return { valid: true };
  }

  const rangePattern = /^(\d+)-(\d+)$/;
  const rangeMatch = trimmed.match(rangePattern);
  if (rangeMatch) {
    const first = parseInt(rangeMatch[1], 10);
    const second = parseInt(rangeMatch[2], 10);
    if (first < second) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Range first number must be smaller than second number' };
    }
  }

  return {
    valid: false,
    error: 'Daily goal text must be a number range (e.g., "1-10"), a single number, or one of: ST, Self Test, Test, T',
  };
}
