import Head from 'next/head';
import { useState, useEffect } from 'react';
import { db, auth } from '@/firebaseConfig';
import {
  collection,
  addDoc,
  query,
  where,
  // orderBy, // commented out per your file
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  increment,
  getDoc,
  arrayRemove
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/router';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [sortOption, setSortOption] = useState<'votes-desc' | 'votes-asc' | 'time-desc' | 'time-asc'>('votes-desc');
  const [filterSelectedCategories, setFilterSelectedCategories] = useState<string[]>([]); // NEW state for filtering
  const router = useRouter();

  const availableCategories = ["UI", "UX", "Performance", "Bug", "Feature", "Other"];

  // Used only for the submission form, unchanged
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // NEW function to toggle filter tags (limit to 3, just like submission form)
  const handleFilterCategoryChange = (category: string) => {
    if (filterSelectedCategories.includes(category)) {
      setFilterSelectedCategories(filterSelectedCategories.filter(c => c !== category));
    } else if (filterSelectedCategories.length < 3) {
      setFilterSelectedCategories([...filterSelectedCategories, category]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      if (!auth.currentUser) {
        alert("You must be logged in to submit a feature request.");
        return;
      }

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

      setTitle('');
      setDescription('');
      setSelectedCategories([]);

    } catch (error) {
      console.error("Error submitting feature request:", error);
      alert("Failed to submit request. Please check your permissions.");
    }
  };

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

      if (userHasUpvoted) {
        // Retract upvote
        await updateDoc(featureRef, {
          upvotes: increment(-1),
          upvotedBy: arrayRemove(uid)
        });
      } else {
        // Add upvote
        await updateDoc(featureRef, {
          upvotes: increment(1),
          upvotedBy: arrayUnion(uid)
        });
      }
    } catch (error) {
      console.error("Error toggling upvote:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error("Error signing out:", err);
      alert("Failed to sign out. Please try again.");
    }
  };

  useEffect(() => {
    // Query all approved features
    const q = query(
      collection(db, "FeatureRequests"),
      where("status", "==", "approved")
      // orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const featuresData: Feature[] = [];
      querySnapshot.forEach((docSnapshot) => {
        featuresData.push({ id: docSnapshot.id, ...(docSnapshot.data() as Feature) });
      });
      setFeatures(featuresData);
    });

    return () => unsubscribe();
  }, []);

  // Sort features locally based on sortOption
  const sortedFeatures = [...features].sort((a, b) => {
    if (sortOption === 'votes-asc') return a.upvotes - b.upvotes;
    if (sortOption === 'votes-desc') return b.upvotes - a.upvotes;
    if (sortOption === 'time-asc') return a.created_at - b.created_at;
    if (sortOption === 'time-desc') return b.created_at - a.created_at;
    return 0;
  });

  // Show only features that have ALL selected filter tags (AND logic).
  const filteredFeatures = sortedFeatures.filter(feature => {
    if (filterSelectedCategories.length === 0) return true;
    return filterSelectedCategories.every(cat => feature.category.includes(cat));
  });

  const currentUser = auth.currentUser;

  return (
    <>
      <Head>
        <title>Feature Leaderboard</title>
        <meta name="description" content="Submit and view feature requests" />
      </Head>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-primary shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-accent6">Feature Leaderboard</h1>
              <nav>
                <ul className="flex space-x-6">
                  <li>
                    <a href="#" className="text-accent6 hover:text-accent5">Dashboard</a>
                  </li>
                  <li>
                    <a href="#" className="text-accent6 hover:text-accent5">Requests</a>
                  </li>
                  <li>
                    <a href="#" className="text-accent6 hover:text-accent5">Settings</a>
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

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="bg-accent5 rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="mb-6 space-y-4">
              {/* Title Input */}
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

              {/* Description Input */}
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

              {/* Category Selection (for submission) */}
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

            {/* Sorting & Filtering on the same row */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
              {/* Sorting Dropdown */}
              <div>
                <label htmlFor="sort" className="mr-2 font-medium text-primary">
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(
                      e.target.value as 'votes-desc' | 'votes-asc' | 'time-desc' | 'time-asc'
                    )
                  }
                  className="border border-accent4 rounded-md p-2 text-primary"
                >
                  <option value="votes-desc">Votes: Greatest to Least</option>
                  <option value="votes-asc">Votes: Least to Greatest</option>
                  <option value="time-desc">Time: Newest First</option>
                  <option value="time-asc">Time: Oldest First</option>
                </select>
              </div>

              {/* Filter Box */}
              <div>
                <span className="mr-2 font-medium text-primary">Filter:</span>
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

            {/* Feature Requests List */}
            <div>
              {filteredFeatures.length > 0 ? (
                <ul className="space-y-4">
                  {filteredFeatures.map((feature, index) => {
                    const currentUser = auth.currentUser?.uid;
                    const userHasUpvoted =
                      currentUser && feature.upvotedBy?.includes(currentUser);

                    return (
                      <li
                        key={feature.id || index}
                        className="bg-accent6 border border-accent4 p-4 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between"
                      >
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-primary break-all">
                            {feature.title}
                          </h3>
                          <p className="text-primary mt-1 break-all">
                            {feature.description}
                          </p>
                          {feature.category && feature.category.length > 0 && (
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
                          )}
                        </div>

                        {/* Upvote Box on the Right with dynamic highlights */}
                        <div
                          onClick={() => handleUpvote(feature)}
                          className={`cursor-pointer border border-accent4 rounded-md p-2 w-12 h-12 flex flex-col items-center justify-center ${
                            userHasUpvoted
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 hover:text-accent2 transition"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                          <span className="text-xs mt-1">
                            {feature.upvotes}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-primary">
                  No approved feature requests yet.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
