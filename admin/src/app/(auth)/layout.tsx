export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-[#f3f7f2] via-[#eef7f0] to-[#e5f1e7]">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
