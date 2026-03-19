import React from "react";

export default function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-[760px] mx-auto px-5 py-8 pb-16">
      {children}
    </main>
  );
}