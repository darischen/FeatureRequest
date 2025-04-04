import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router"; // next routing
import { auth, db } from "@/firebaseConfig"; // firebase configuration
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"; // firebase auth functions
import { doc, setDoc } from "firebase/firestore"; // 

export default function Login() {
  // state variables for login and registration
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(""); // used for registration
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // submit function for login and registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        // sign in with email and password
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // register with email and password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        // set user data in firestore
        await setDoc(doc(db, "Users", user.uid), {
          id: user.uid,
          username: username,
          role: "user",
        });
      }
      // redirect to leaderboard page after successful login/registration
      router.push("/leaderboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // function for google sign in
  const handleGoogleSignIn = async () => {
    setError("");
    // sign in with google
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/leaderboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Head>
        <title>{`${isLogin ? "Login" : "Register"} - Feature Leaderboard`}</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-black">
            {isLogin ? "Login" : "Register"}
          </h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-black">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border rounded text-black"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-black">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded text-black"
                required
              />
            </div>
            <div>
              <label className="block text-black">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded text-black"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </form>
          <div className="mt-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-red-500 text-white p-2 rounded"
            >
              Sign in with Google
            </button>
          </div>
          <p className="mt-4 text-center text-black">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 underline"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
