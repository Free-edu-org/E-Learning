export function getAcceptedAnswers(
  correctAnswers: string[] | null | undefined,
  correctAnswer: string | null | undefined,
) {
  const answers =
    correctAnswers && correctAnswers.length > 0
      ? correctAnswers
      : correctAnswer
        ? [correctAnswer]
        : [];

  return answers.map((answer) => answer.trim()).filter(Boolean);
}

export function formatAcceptedAnswers(
  correctAnswers: string[] | null | undefined,
  correctAnswer: string | null | undefined,
) {
  return getAcceptedAnswers(correctAnswers, correctAnswer).join(", ");
}
