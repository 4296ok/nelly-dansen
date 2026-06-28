import { isAuthed } from "@/lib/auth";
import { getArtworks } from "@/lib/store";
import LoginForm from "@/components/LoginForm";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthed())) {
    return <LoginForm />;
  }
  const artworks = await getArtworks();
  return <AdminDashboard initial={artworks} />;
}
