import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import { siteName } from "@/constants";


export const metadata = {
  title: `Admin Panel - ${siteName}`,
  description: "Admin dashboard for managing Remote JobsHive.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
