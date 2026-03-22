export const calculatePriority = (attempts) => {
  return attempts
    .sort((a, b) => {
      // Higher score first
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // Tie -> earlier submission wins
      return new Date(a.createdAt) - new Date(b.createdAt);
    })
    .map((attempt, index) => ({
      userId: attempt.userId,
      score: attempt.score,
      priority: index + 1,
    }));
};