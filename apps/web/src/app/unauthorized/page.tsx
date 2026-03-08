export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-gray-500">
          You don&apos;t have permission to view this page.
        </p>
        <a href="/" className="underline">
          Go home
        </a>
      </div>
    </div>
  );
}
