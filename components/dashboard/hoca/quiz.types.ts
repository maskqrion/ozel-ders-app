export type DraftQuestion = {
  uid: string;
  question_text: string;
  options: [string, string, string, string];
  correct_index: number;
};

export function newQuestion(): DraftQuestion {
  const uid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    uid,
    question_text: "",
    options: ["", "", "", ""],
    correct_index: 0,
  };
}

export type QuizOlusturucuProps = {
  open: boolean;
  onClose: () => void;
  defaultTitle?: string;
  lessonId?: string;
  onSaved: (quizId: string) => void | Promise<void>;
};
