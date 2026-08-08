import Link from "next/link";
import { RecipeList } from "./RecipeList";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main>
      <div className={styles.header}>
        <div>
          <h1>RecipeManager</h1>
        </div>
        <Link href="/recipes/new" className="btn btn-primary">
          + 新規登録
        </Link>
      </div>
      <RecipeList />
    </main>
  );
}
