import { RecipeEditForm } from "./RecipeEditForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;

  return (
    <main>
      <div className="page-intro">
        <h1>レシピを編集</h1>
      </div>
      <RecipeEditForm recipeId={Number(id)} />
    </main>
  );
}
