import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/app/actions/auth";

export default function SignupPage() {
  return <AuthForm mode="signup" action={signUp} />;
}
