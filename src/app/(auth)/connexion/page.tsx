import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Connexion" };

export default function SignInPage() {
  return <AuthForm mode="signin" />;
}
