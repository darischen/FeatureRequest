import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/firebaseConfig'; // database
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  increment,
  getDoc,
  arrayRemove,
} from 'firebase/firestore'; //firestore database functions
import { signOut } from 'firebase/auth'; //sign out of account
import { useRouter } from 'next/router'; //page routing
import Navbar from "../components/navbar"; //navbar at the top of the screen
import toast, { Toaster } from 'react-hot-toast'; //notifications for rejected requests

// Data type for feature requests
interface Feature {
  id?: string;
  title: string;
  description: string;
  category: string[];
  upvotes: number;
  upvotedBy?: string[];
  status?: string;
  submitted_by?: string | null;
  created_at: number;
}

export default function FeatureRequestPage() {
  //variables for inputs, toggles, and state management
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [userRequests, setUserRequests] = useState<Feature[]>([]);
  const [sortOption, setSortOption] = useState<'votes-desc' | 'votes-asc' | 'time-desc' | 'time-asc'>('votes-desc');
  const [filterSelectedCategories, setFilterSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'myrequests'>('leaderboard');

  //Category selection for requests
  const router = useRouter();
  const availableCategories = ["UI", "UX", "Performance", "Bug", "Feature", "Other"];

  const currentUser = auth.currentUser;

  // Ref to track which rejected requests have already triggered a notification
  const notifiedRejectedRef = useRef<Set<string>>(new Set());

  // handle category selection for feature requests
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // handling for filter requests by categories
  const handleFilterCategoryChange = (category: string) => {
    if (filterSelectedCategories.includes(category)) {
      setFilterSelectedCategories(filterSelectedCategories.filter(c => c !== category));
    } else if (filterSelectedCategories.length < 3) {
      setFilterSelectedCategories([...filterSelectedCategories, category]);
    }
  };

  // submitting a feature request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      if (!auth.currentUser) {
        alert("You must be logged in to submit a feature request.");
        return;
      }

      // if user is logged in, add the request to the database
      await addDoc(collection(db, "FeatureRequests"), {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategories.length > 0 ? selectedCategories : ["Other"],
        status: "pending",
        upvotes: 0,
        upvotedBy: [],
        submitted_by: auth.currentUser.uid,
        created_at: Date.now()
      });

      // reset the form fields
      setTitle('');
      setDescription('');
      setSelectedCategories([]);

    } catch (error) {
      console.error("Error submitting feature request:", error);
      alert("Failed to submit request. Please check your permissions.");
    }
  };

  //upvote a feature request
  const handleUpvote = async (feature: Feature) => {
    if (!auth.currentUser) {
      alert("Please login to upvote.");
      return;
    }
    if (!feature.id) return;

    const uid = auth.currentUser.uid;
    const featureRef = doc(db, "FeatureRequests", feature.id);

    try {
      const featureSnap = await getDoc(featureRef);
      if (!featureSnap.exists()) return;

      const featureData = featureSnap.data() as Feature;
      const userHasUpvoted = featureData.upvotedBy && featureData.upvotedBy.includes(uid);

      // each user can only upvote once, so toggle the upvote
      if (userHasUpvoted) {
        await updateDoc(featureRef, {
          upvotes: increment(-1),
          upvotedBy: arrayRemove(uid)
        });
      } else {
        await updateDoc(featureRef, {
          upvotes: increment(1),
          upvotedBy: arrayUnion(uid)
        });
      }
    } catch (error) {
      console.error("Error toggling upvote:", error);
    }
  };

  // update the approved list of feature requests
  const fetchRequests = () => {
    const approvedQuery = query(collection(db, "FeatureRequests"), where("status", "==", "approved"));
    const userQuery = currentUser
      ? query(collection(db, "FeatureRequests"), where("submitted_by", "==", currentUser.uid))
      : null;

    // stop listening to the database on approved feature requests
    const unsub1 = onSnapshot(approvedQuery, (snapshot) => {
      const data: Feature[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...(docSnap.data() as Feature) });
      });
      setFeatures(data);
    });

    // stop listening to the database on current user feature requests
    const unsub2 = userQuery
      ? onSnapshot(userQuery, (snapshot) => {
          const data: Feature[] = [];
          snapshot.forEach((docSnap) => {
            data.push({ id: docSnap.id, ...(docSnap.data() as Feature) });
          });
          setUserRequests(data);
        })
      : () => {};

    return () => {
      unsub1();
      unsub2();
    };
  };

  useEffect(() => {
    const unsubscribe = fetchRequests();
    return () => unsubscribe();
  }, [currentUser]);

  /* Live notification for rejected feature requests */
  useEffect(() => {
    userRequests.forEach((feature) => {
      if (feature.status === "rejected" && feature.id && !notifiedRejectedRef.current.has(feature.id)) {
        toast.error(`Your feature request "${feature.title}" was rejected.`);
        notifiedRejectedRef.current.add(feature.id);
      }
    });
  }, [userRequests]);

  const sortedFeatures = [...features].sort((a, b) => {
    if (sortOption === 'votes-asc') return a.upvotes - b.upvotes;
    if (sortOption === 'votes-desc') return b.upvotes - a.upvotes;
    if (sortOption === 'time-asc') return a.created_at - b.created_at;
    if (sortOption === 'time-desc') return b.created_at - a.created_at;
    return 0;
  });

  const searchedFeatures = sortedFeatures.filter(feature => {
    const q = searchQuery.toLowerCase();
    return feature.title.toLowerCase().includes(q) || feature.description.toLowerCase().includes(q);
  });

  const filteredFeatures = searchedFeatures.filter(feature => {
    if (filterSelectedCategories.length === 0) return true;
    return filterSelectedCategories.every(cat => feature.category.includes(cat));
  });

  const statusBadge = (status: string | undefined) => {
    const base = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case "pending": return <span className={`${base} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case "approved": return <span className={`${base} bg-green-100 text-green-800`}>Approved</span>;
      case "done": return <span className={`${base} bg-blue-100 text-blue-800`}>Done</span>;
      case "rejected": return <span className={`${base} bg-red-100 text-red-800`}>Rejected</span>;
      default: return null;
    }
  };

  return (
    <>
      <Head>
        <title>Feature Leaderboard</title>
        <meta name="description" content="Submit and view feature requests" />
      </Head>
      <div className="min-h-screen bg-white">
        <Navbar />
        <Toaster position="top-right" />
        <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-4xl mx-auto flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded ${activeTab === 'leaderboard' ? 'bg-[#2A6F97] text-white' : 'bg-[#A9D6E5] text-black'}`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('myrequests')}
              className={`px-4 py-2 rounded ${activeTab === 'myrequests' ? 'bg-[#2A6F97] text-white' : 'bg-[#A9D6E5] text-black'}`}
            >
              My Requests
            </button>
          </div>

          {/* Submission form appears only on Leaderboard tab */}
          {activeTab === 'leaderboard' && (
            <div className="bg-accent5 rounded-lg shadow p-6 mb-8">
              <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-primary font-medium mb-1">
                    Title (max 100 characters)
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    className="w-full border border-accent4 rounded-md p-2 text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="Enter feature title..."
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-primary font-medium mb-1">
                    Description (max 500 characters)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full border border-accent4 rounded-md p-2 text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="Enter feature description..."
                  />
                </div>

                <div>
                  <p className="text-primary font-medium mb-1">Select up to 3 categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => (
                      <label key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className="form-checkbox h-5 w-5 text-secondary"
                        />
                        <span className="text-primary">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full bg-secondary text-accent6 py-2 rounded-md hover:bg-tertiary transition"
                >
                  Submit Request
                </button>
              </form>

              {/* Sorting and Filtering */}
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-accent4 rounded-md p-2 text-primary focus:outline-none focus:ring-2 focus:ring-secondary w-48"
                />
                <div className="flex items-center">
                  <label htmlFor="sort" className="mr-2 font-medium text-primary">Sort:</label>
                  <select
                    id="sort"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="border border-accent4 rounded-md p-2 text-primary"
                  >
                    <option value="votes-desc">Votes: Greatest to Least</option>
                    <option value="votes-asc">Votes: Least to Greatest</option>
                    <option value="time-desc">Time: Newest First</option>
                    <option value="time-asc">Time: Oldest First</option>
                  </select>
                </div>
                <div className="w-72">
                  <p className="text-primary font-medium mb-1">Filter Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => (
                      <label key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filterSelectedCategories.includes(category)}
                          onChange={() => handleFilterCategoryChange(category)}
                          className="form-checkbox h-5 w-5 text-secondary"
                        />
                        <span className="text-primary">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feature list display */}
          <div>
            {(activeTab === 'leaderboard' ? filteredFeatures : userRequests).length > 0 ? (
              <ul className="space-y-4">
                {(activeTab === 'leaderboard' ? filteredFeatures : userRequests).map((feature, index) => {
                  const userHasUpvoted = currentUser?.uid && feature.upvotedBy?.includes(currentUser.uid);
                  return (
                    <li
                      key={feature.id || index}
                      className="bg-accent6 border border-accent4 p-4 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-primary break-all">{feature.title}</h3>
                        <p className="text-primary mt-1 break-all">{feature.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {feature.category.map((cat, i) => (
                            <span key={i} className="bg-secondary text-accent6 px-2 py-1 rounded text-xs">{cat}</span>
                          ))}
                          {activeTab === "myrequests" && statusBadge(feature.status)}
                        </div>
                      </div>

                      {activeTab === "leaderboard" && (
                        <div
                          onClick={() => handleUpvote(feature)}
                          className={`cursor-pointer border border-accent4 rounded-md p-2 w-12 h-12 flex flex-col items-center justify-center ${
                            userHasUpvoted ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          <span className="text-xs mt-1">{feature.upvotes}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-primary">No requests to show.</p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
