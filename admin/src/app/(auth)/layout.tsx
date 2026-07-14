export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fcfdfe] relative overflow-hidden font-sans">
      {/* Background fluid blobs matching mockup but in green colors */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-100/40 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-100/40 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-green-100/30 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl z-10">{children}</div>
    </div>
  );
}
