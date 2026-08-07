import { RecipeDetail } from "./RecipeDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main>
      <RecipeDetail recipeId={Number(id)} />
    </main>
  );
}
