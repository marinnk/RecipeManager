import { RecipeEditForm } from "./RecipeEditForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;

  return (
    <main>
      <div className="page-intro">
        <span className="eyebrow">編集</span>
        <h1>レシピを編集</h1>
      </div>
      <RecipeEditForm recipeId={Number(id)} />
    </main>
  );
}
