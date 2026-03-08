import { signIn } from "@/lib/auth";

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-bold">Sign in</h1>

        {/* Google */}
        <form
          action={async () => {
            "use server";
            await signIn("google", {
              redirectTo: searchParams.callbackUrl ?? "/dashboard",
            });
          }}
        >
          <button type="submit" className="w-full border rounded px-4 py-2">
            Continue with Google
          </button>
        </form>

        {/* GitHub */}
        <form
          action={async () => {
            "use server";
            await signIn("github", {
              redirectTo: searchParams.callbackUrl ?? "/dashboard",
            });
          }}
        >
          <button type="submit" className="w-full border rounded px-4 py-2">
            Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
