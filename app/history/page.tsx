"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function History() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generations, setGenerations] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        fetchHistory(data.session.user.id);
      } else {
        router.push("/login");
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      router.push("/login");
    });
  }, [router]);

  async function fetchHistory(userId: string) {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setGenerations(data);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-blue-600 font-bold text-lg">AI Listing Optimizer</a>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">Generator</a>
          <a href="/history" className="text-sm text-blue-600 font-medium border-b-2 border-blue-600 pb-1">History</a>
          <span className="text-sm text-gray-500">{user.email}</span>
          <button onClick={() => { supabase.auth.signOut(); router.push("/"); }} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Log out</button>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto mt-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Generation History</h1>
        {generations.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>No generations yet.</p>
            <a href="/dashboard" className="text-blue-600 mt-2 inline-block">Go generate your first listing</a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {generations.map((gen) => (
              <div key={gen.id} className="bg-white rounded-lg border shadow-sm p-4 cursor-pointer hover:shadow-md transition" onClick={() => setExpanded(expanded === gen.id ? null : gen.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-800">{gen.product_name || "Untitled"}</span>
                    <span className="ml-3 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">{gen.lang || "en"}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(gen.created_at).toLocaleString()}</span>
                </div>
                {expanded === gen.id && gen.output_data && (
                  <div className="mt-4 border-t pt-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{gen.output_data}</pre>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(gen.output_data); }} className="mt-3 text-sm bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}