import Link from "next/link";
import { RecipeList } from "./RecipeList";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main>
      <div className={styles.header}>
        <h1>RecipeManager</h1>
        <Link href="/recipes/new" className={styles.registerLink}>
          + 新規登録
        </Link>
      </div>
      <RecipeList />
    </main>
  );
}
