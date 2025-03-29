import { auth } from "@/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();
  const currentUser = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
      alert("Failed to sign out. Please try again.");
    }
  };

  return (
    <header className="bg-primary shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-accent6">Feature Leaderboard</h1>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="/dash" className="text-accent6 hover:text-accent5">Dashboard</a>
              </li>
              <li>
                <a href="/leaderboard" className="text-accent6 hover:text-accent5">Requests</a>
              </li>
              {currentUser && (
                <li>
                  <button onClick={handleLogout} className="text-accent6 hover:text-accent5">
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
