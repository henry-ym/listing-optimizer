"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

type Generation = {
  id: string;
  created_at: string;
  product_name: string;
  output_data: string;
  lang: string;
};

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from Supabase auth
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchGenerations(user.id);
      } else {
        setLoading(false);
      }
    }

    async function fetchGenerations(userId: string) {
      setLoading(true);
      let { data, error } = await supabase
        .from("generations")
        .select("id,created_at,product_name,output_data,lang")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        // Could implement error display
        setGenerations([]);
      } else {
        setGenerations(data || []);
      }
      setLoading(false);
    }

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">
            🕑 Generation History
          </h1>
          <Link
            href="/"
            className="text-blue-600 font-medium px-4 py-1 bg-white rounded border border-blue-500 hover:bg-blue-50 shadow"
          >
            Back to Main
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-gray-600 py-8">Loading...</div>
        ) : user ? (
          generations.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No generations found.
            </div>
          ) : (
            <ul className="space-y-4">
              {generations.map((g) => (
                <li
                  key={g.id}
                  className="p-5 bg-white rounded-lg shadow flex flex-col gap-2 border border-gray-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-lg text-gray-700">
                      {g.product_name}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(g.created_at).toLocaleString()}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-600 rounded px-2 py-0.5 ml-auto">
                      {g.lang.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-600 text-sm line-clamp-3">
                    {g.output_data && typeof g.output_data === "string"
                      ? g.output_data.slice(0, 300) +
                        (g.output_data.length > 300 ? "..." : "")
                      : JSON.stringify(g.output_data)}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="text-gray-500 text-center py-8">
            Please log in to view your generation history.
          </div>
        )}
      </div>
    </main>
  );
}