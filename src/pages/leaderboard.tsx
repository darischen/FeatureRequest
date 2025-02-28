import Head from 'next/head';
import { useState, useEffect } from 'react';
import { db, auth } from '@/firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  arrayUnion, 
  increment 
} from 'firebase/firestore';

interface Feature {
  id?: string;
  title: string;
  description: string;
  categories: string[];
  upvotes: number;
  upvotedBy?: string[];
  status?: string;
  submittedBy?: string | null;
  createdAt: number;
}

export default function FeatureRequestPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [sortOption, setSortOption] = useState<'votes-desc' | 'votes-asc' | 'time-desc' | 'time-asc'>('votes-desc');

  // Sample available categories. You can customize these.
  const availableCategories = ["UI", "UX", "Performance", "Bug", "Feature", "Other"];

  // Handle category checkbox changes. Limit selection to max of 3.
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Submit a new feature request to Firestore.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    try {
      await addDoc(collection(db, "FeatureRequests"), {
        title,
        description,
        categories: selectedCategories,
        upvotes: 0,
        upvotedBy: [],
        status: "pending", // new requests are pending admin approval
        submittedBy: auth.currentUser ? auth.currentUser.uid : null,
        createdAt: Date.now()
      });
      // Reset form fields
      setTitle('');
      setDescription('');
      setSelectedCategories([]);
    } catch (error) {
      console.error("Error adding feature: ", error);
    }
  };

  // Upvote a feature; allow each user to upvote only once.
  const handleUpvote = async (featureId: string | undefined, feature: Feature) => {
    if (!auth.currentUser) {
      alert("Please login to upvote.");
      return;
    }
    if (!featureId) return;
    const uid = auth.currentUser.uid;
    if (feature.upvotedBy && feature.upvotedBy.includes(uid)) {
      alert("You have already upvoted this request.");
      return;
    }
    try {
      const featureRef = doc(db, "FeatureRequests", featureId);
      await updateDoc(featureRef, {
        upvotes: increment(1),
        upvotedBy: arrayUnion(uid)
      });
    } catch (error) {
      console.error("Error upvoting feature: ", error);
    }
  };

  // Listen to real-time updates in the "FeatureRequests" collection.
  useEffect(() => {
    const q = query(collection(db, "FeatureRequests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const featuresData: Feature[] = [];
      querySnapshot.forEach((docSnapshot) => {
        featuresData.push({ id: docSnapshot.id, ...(docSnapshot.data() as Feature) });
      });
      setFeatures(featuresData);
    });
    return () => unsubscribe();
  }, []);

  // Sort features locally based on sortOption.
  const sortedFeatures = [...features].sort((a, b) => {
    if (sortOption === 'votes-asc') return a.upvotes - b.upvotes;
    if (sortOption === 'votes-desc') return b.upvotes - a.upvotes;
    if (sortOption === 'time-asc') return a.createdAt - b.createdAt;
    if (sortOption === 'time-desc') return b.createdAt - a.createdAt;
    return 0;
  });

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

              {/* Category Selection */}
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

            {/* Sorting Dropdown */}
            <div className="mb-4">
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

            {/* Feature Requests List */}
            <div>
              {sortedFeatures.length > 0 ? (
                <ul className="space-y-4">
                  {sortedFeatures.map((feature, index) => (
                    <li
                      key={feature.id || index}
                      className="bg-accent6 border border-accent4 p-4 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-primary break-all">{feature.title}</h3>
                        <p className="text-primary mt-1 break-all">{feature.description}</p>
                        {feature.categories && feature.categories.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {feature.categories.map((cat, i) => (
                              <span key={i} className="bg-secondary text-accent6 px-2 py-1 rounded text-xs">
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleUpvote(feature.id, feature)}
                        className="mt-4 md:mt-0 flex flex-col items-center justify-center border border-accent4 rounded-md p-2 w-12 h-12 focus:outline-none"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-accent3 hover:text-accent2 transition"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span className="text-primary text-xs mt-1">{feature.upvotes}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-primary">No feature requests yet. Be the first to submit one!</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
