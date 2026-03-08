export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Authentication error</h1>
        <p className="text-gray-500">{searchParams.error ?? "Unknown error"}</p>
        <a href="/auth/signin" className="underline">
          Try again
        </a>
      </div>
    </div>
  );
}
