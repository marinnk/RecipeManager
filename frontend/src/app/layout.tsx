import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecipeManager",
  description: "気になったレシピをブックマークして、あとから見返せる個人用レシピ管理アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
