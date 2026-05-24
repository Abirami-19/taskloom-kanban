import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/app/actions/auth";

export default function LoginPage() {
  return <AuthForm mode="login" action={signIn} />;
}
