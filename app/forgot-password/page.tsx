import { AuthForm } from "@/components/auth/auth-form";
import { resetPassword } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  return <AuthForm mode="reset" action={resetPassword} />;
}
