import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { DraftQuestion, newQuestion, QuizOlusturucuProps } from "../quiz.types";

export function useQuizBuilder({ open, onClose, defaultTitle, onSaved }: QuizOlusturucuProps) {
  const [title, setTitle] = useState<string>(defaultTitle ?? "");
  const [description, setDescription] = useState<string>("");
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => [newQuestion()]);
  const [saving, setSaving] = useState(false);

  // Modal açılırken formu render sırasında sıfırla
  // (effect içinde senkron setState cascading render yaratıyordu).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(defaultTitle ?? "");
      setDescription("");
      setQuestions([newQuestion()]);
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  const addQuestion = () => setQuestions((qs) => [...qs, newQuestion()]);
  
  const removeQuestion = (uid: string) =>
    setQuestions((qs) => (qs.length <= 1 ? qs : qs.filter((q) => q.uid !== uid)));
  
  const updateQuestion = (uid: string, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.uid === uid ? { ...q, ...patch } : q)));
  
  const updateOption = (uid: string, idx: number, value: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.uid === uid
          ? {
              ...q,
              options: q.options.map((o, i) => (i === idx ? value : o)) as DraftQuestion["options"],
            }
          : q,
      ),
    );

  const validate = (): string | null => {
    if (!title.trim()) return "Quiz başlığı zorunludur.";
    if (questions.length === 0) return "En az bir soru eklemelisiniz.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) return `Soru ${i + 1}: soru metni boş olamaz.`;
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) return `Soru ${i + 1}: ${"ABCD"[j]} şıkkı boş olamaz.`;
      }
      if (q.correct_index < 0 || q.correct_index > 3)
        return `Soru ${i + 1}: doğru cevap seçilmedi.`;
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("create_quiz_with_questions", {
        p_title: title.trim(),
        p_description: description.trim() || "",
        p_questions: questions.map((q, i) => ({
          question_text: q.question_text.trim(),
          options: q.options.map((o) => o.trim()),
          correct_index: q.correct_index,
          order_index: i,
        })),
      });
      if (error) throw error;
      await onSaved(data as string);
      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : null;
      toast.error("Quiz kaydedilemedi: " + (message ?? "Bilinmeyen hata"));
    } finally {
      setSaving(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    questions,
    saving,
    addQuestion,
    removeQuestion,
    updateQuestion,
    updateOption,
    handleSave,
  };
}
