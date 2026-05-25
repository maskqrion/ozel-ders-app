export const XP_PER_LEVEL = 1000;

export const XP_REWARDS = {
  LESSON_COMPLETE: 20,
  QUIZ_CREATED: 50,
  ASSIGNMENT_GRADED: 10,
} as const;

export const QUERY_STALE = {
  PROFILE: 5 * 60 * 1000,
  LESSONS: 2 * 60 * 1000,
  ASSIGNMENTS: 2 * 60 * 1000,
  RESOURCES: 5 * 60 * 1000,
} as const;

export const QUERY_GC = 10 * 60 * 1000;
