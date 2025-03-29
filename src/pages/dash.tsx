import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import Navbar from "../components/navbar";

interface Feature {
  docId: string;
  title: string;
  description: string;
  category: string[];
  submitted_by?: string;
  created_at: number;
}

export default function AdminDashboard() {
  const [pendingFeatures, setPendingFeatures] = useState<Feature[]>([]);
  const router = useRouter();

  useEffect(() => {
    const q = query(
      collection(db, "FeatureRequests"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const featuresData: Feature[] = [];
      querySnapshot.forEach((docSnap) => {
        featuresData.push({ ...(docSnap.data() as Feature), docId: docSnap.id });
      });
      setPendingFeatures(featuresData);
    });

    return () => unsubscribe();
  }, []);

  const handleDecision = async (docId: string, decision: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "FeatureRequests", docId), {
        status: decision,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  return (
    <>
        <Navbar/>
      <Head>
        <title>Admin Dashboard - Feature Approvals</title>
      </Head>
      <div className="min-h-screen bg-gray-100 py-10 px-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          Admin Dashboard
        </h1>
        {pendingFeatures.length === 0 ? (
          <p className="text-center text-gray-700">No pending feature requests.</p>
        ) : (
          <ul className="space-y-4 max-w-4xl mx-auto">
            {pendingFeatures.map((feature) => (
              <li
                key={feature.docId}
                className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
              >
                <div className="mb-2 md:mb-0">
                  <h2 className="text-lg font-semibold text-black">{feature.title}</h2>
                  <p className="text-sm text-gray-700">{feature.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {feature.category.map((cat, i) => (
                      <span
                        key={i}
                        className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDecision(feature.docId, "approved")}
                    className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(feature.docId, "rejected")}
                    className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
