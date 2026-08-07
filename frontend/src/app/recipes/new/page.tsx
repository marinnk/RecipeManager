import { RecipeRegisterForm } from "./RecipeRegisterForm";

export default function NewRecipePage() {
  return (
    <main>
      <div className="page-intro">
        <span className="eyebrow">新規登録</span>
        <h1>レシピを登録</h1>
      </div>
      <RecipeRegisterForm />
    </main>
  );
}
