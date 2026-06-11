import type { Metadata } from "next";
import YardimMerkezi from "./_components/YardimMerkezi";

export const metadata: Metadata = {
  title: "Yardım Merkezi — Özel Ders Pro",
  description:
    "Özel Ders Pro hakkında sıkça sorulan sorular: rezervasyonlar, ödemeler, cüzdan, ödevler, quizler ve hesap güvenliği.",
};

export default function YardimPage() {
  return <YardimMerkezi />;
}
