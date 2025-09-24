import ScrollToTop from "./_components/scroll-to-top";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ScrollToTop />
    </>
  );
}
