import "./globals.css";

export const metadata = {
  title: "{{PROJECT_NAME}}",
  description: "Created with @atnexuslab/create-app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
