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
  doc
} from "firebase/firestore";
import Navbar from "../components/navbar";

interface Feature {
  docId: string;
  title: string;
  description: string;
  category: string[];
  status: string;
  submitted_by?: string;
  created_at: number;
}

export default function AdminDashboard() {
  const [pendingFeatures, setPendingFeatures] = useState<Feature[]>([]);
  const [approvedFeatures, setApprovedFeatures] = useState<Feature[]>([]);
  const [doneFeatures, setDoneFeatures] = useState<Feature[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "done">("pending");
  const router = useRouter();

  useEffect(() => {
    const unsubPending = onSnapshot(
      query(collection(db, "FeatureRequests"), where("status", "==", "pending")),
      (snapshot) => {
        const data: Feature[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ ...(docSnap.data() as Feature), docId: docSnap.id });
        });
        setPendingFeatures(data);
      }
    );

    const unsubApproved = onSnapshot(
      query(collection(db, "FeatureRequests"), where("status", "==", "approved")),
      (snapshot) => {
        const data: Feature[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ ...(docSnap.data() as Feature), docId: docSnap.id });
        });
        setApprovedFeatures(data);
      }
    );

    const unsubDone = onSnapshot(
      query(collection(db, "FeatureRequests"), where("status", "==", "done")),
      (snapshot) => {
        const data: Feature[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ ...(docSnap.data() as Feature), docId: docSnap.id });
        });
        setDoneFeatures(data);
      }
    );

    return () => {
      unsubPending();
      unsubApproved();
      unsubDone();
    };
  }, []);

  const handleDecision = async (
    docId: string,
    decision: "approved" | "rejected" | "done"
  ) => {
    try {
      await updateDoc(doc(db, "FeatureRequests", docId), {
        status: decision,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const renderFeatureList = (
    features: Feature[],
    actions: (feature: Feature) => React.ReactNode
  ) => {
    return features.length === 0 ? (
      <p className="text-center text-gray-700">No feature requests here.</p>
    ) : (
      <ul className="space-y-4 max-w-4xl mx-auto">
        {features.map((feature) => (
          <li
            key={feature.docId}
            className="bg-accent6 p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div className="mb-2 md:mb-0">
              <h2 className="text-lg font-semibold text-black">{feature.title}</h2>
              <p className="text-sm text-gray-700">{feature.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {feature.category.map((cat, i) => (
                  <span
                    key={i}
                    className="bg-secondary text-accent6 px-2 py-1 rounded text-xs"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex space-x-2 mt-2 md:mt-0">
              {actions(feature)}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <Navbar />
      <Head>
        <title>Admin Dashboard - Feature Approvals</title>
      </Head>
      <div className="min-h-screen bg-gray-100 py-10 px-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex justify-center space-x-4 mb-6">
          {["pending", "approved", "done"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "pending" | "approved" | "done")}
              className={`px-4 py-2 rounded capitalize ${
                activeTab === tab
                  ? "bg-[#2A6F97] text-white"
                  : "bg-[#A9D6E5] text-black border"
              }`}
            >
              {tab === "pending"
                ? "Pending Requests"
                : tab === "approved"
                ? "Approved (Mark as Done)"
                : "Completed (Done)"}
            </button>
          ))}
        </div>

        {activeTab === "pending" &&
          renderFeatureList(pendingFeatures, (feature) => (
            <>
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
            </>
          ))}

        {activeTab === "approved" &&
          renderFeatureList(approvedFeatures, (feature) => (
            <button
              onClick={() => handleDecision(feature.docId, "done")}
              className="bg-quaternary text-white px-4 py-1 rounded hover:bg-indigo-600"
            >
              Mark as Done
            </button>
          ))}

        {activeTab === "done" &&
          renderFeatureList(doneFeatures, () => <></>)}
      </div>
    </>
  );
}