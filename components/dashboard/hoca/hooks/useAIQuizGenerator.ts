import { useState, useRef, useTransition, useEffect } from "react";
import toast from "react-hot-toast";
import { generateAIQuiz } from "@/app/actions/ai-quiz";

export function useAIQuizGenerator(
  lessonId: string | undefined,
  onSuccess: (quizId: string) => void | Promise<void>,
  onClose: () => void
) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<"kolay" | "orta" | "zor">("orta");
  const [isGenerating, startGenerating] = useTransition();
  const aiInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aiOpen) aiInputRef.current?.focus();
  }, [aiOpen]);

  const handleAiGenerate = () => {
    const topic = aiTopic.trim();
    if (!topic) {
      toast.error("Konu boş olamaz.");
      return;
    }
    startGenerating(async () => {
      const result = await generateAIQuiz({
        topic,
        questionCount: aiCount,
        difficulty: aiDifficulty,
        ...(lessonId ? { lessonId } : {}),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setAiTopic("");
      setAiOpen(false);
      toast.success(`${result.questions.length} sorulu quiz oluşturuldu ve kaydedildi.`);
      await onSuccess(result.quizId);
      onClose();
    });
  };

  return {
    aiOpen,
    setAiOpen,
    aiTopic,
    setAiTopic,
    aiCount,
    setAiCount,
    aiDifficulty,
    setAiDifficulty,
    isGenerating,
    handleAiGenerate,
    aiInputRef,
  };
}
