import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen flex items-center justify-center wood-grain p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
