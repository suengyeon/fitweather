import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";

export default function MyPageLikes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likedRecords, setLikedRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLikedRecords = async () => {
      try {
        const q = query(
          collection(db, "records"),
          where("likes", "array-contains", user.uid),
          where("isPublic", "==", true)
        );

        const snapshot = await getDocs(q);
        const records = [];
        snapshot.forEach(doc => {
          records.push({ id: doc.id, ...doc.data() });
        });

        setLikedRecords(records);
      } catch (error) {
        console.error("Error fetching liked records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedRecords();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button 
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
          onClick={() => navigate("/mypage")}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">내가 좋아요 한 코디</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-300 px-3 py-1 rounded-md hover:bg-blue-400"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">내가 좋아요 한 코디</h1>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : likedRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">아직 좋아요한 코디가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedRecords.map((record) => (
                <div key={record.id} className="bg-white rounded-lg shadow p-4">
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">{record.date}</p>
                    <p className="font-semibold">{record.nickname || "익명"}</p>
                  </div>
                  
                  {record.imageUrls && record.imageUrls.length > 0 && (
                    <div className="mb-3">
                      <img 
                        src={record.imageUrls[0]} 
                        alt="Outfit" 
                        className="w-full h-48 object-cover rounded"
                      />
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      온도: {record.temp}°C, 강수량: {record.rain}mm
                    </p>
                  </div>
                  
                  {record.outfit && (
                    <div className="text-sm text-gray-700">
                      <p><strong>아우터:</strong> {record.outfit.outer?.join(", ") || "없음"}</p>
                      <p><strong>상의:</strong> {record.outfit.top?.join(", ") || "없음"}</p>
                      <p><strong>하의:</strong> {record.outfit.bottom?.join(", ") || "없음"}</p>
                      <p><strong>신발:</strong> {record.outfit.shoes?.join(", ") || "없음"}</p>
                    </div>
                  )}
                  
                  {record.memo && (
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">{record.memo}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 