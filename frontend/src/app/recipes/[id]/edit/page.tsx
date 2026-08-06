import { RecipeEditForm } from "./RecipeEditForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;

  return (
    <main>
      <h1>レシピを編集</h1>
      <RecipeEditForm recipeId={Number(id)} />
    </main>
  );
}
