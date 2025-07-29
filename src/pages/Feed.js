import React, { useEffect, useState } from "react";
import FeedCard from "../components/FeedCard";
import { getRecords } from "../api/getRecords";
import { toggleLike } from "../api/toggleLike";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

function Feed() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState([]);
  const [order, setOrder] = useState("popular"); // 인기순 or 최신순
  const [region, setRegion] = useState(""); // 초기값 빈 문자열

  // 사용자 region fetch
  useEffect(() => {
    async function fetchUserRegion() {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setRegion(userSnap.data().region || "Seoul");
      } else {
        setRegion("Seoul");
      }
    }
    fetchUserRegion();
  }, [user]);

  // region/order 바뀔 때마다 records fetch
  useEffect(() => {
    if (!region) return;
    getRecords(region, order).then(setOutfits);
  }, [region, order]);

  // 좋아요 토글 함수 (Firestore + UI 동기화)
  const handleToggleLike = async (recordId, liked) => {
    if (!user) return;
    await toggleLike(recordId, user.uid);
    setOutfits(prev =>
      prev.map(record =>
        record.id === recordId
          ? {
              ...record,
              likes: liked
                ? record.likes.filter(uid => uid !== user.uid)
                : [...record.likes, user.uid],
            }
          : record
      )
    );
  };

  // 인기순일 때 TOP3 분리
  const isPopular = order === "popular";
  let top3 = [];
  let rest = outfits;
  if (isPopular && outfits.length > 0) {
    const sorted = [...outfits].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    top3 = sorted.slice(0, 3);
    rest = sorted.slice(3);
  }

  return (
    <div>
      {/* 정렬/지역 드롭다운 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select value={region} onChange={e => setRegion(e.target.value)}>
          <option value="Seoul">서울</option>
          <option value="Busan">부산</option>
          <option value="Daejeon">대전</option>
          <option value="Daegu">대구</option>
          <option value="Incheon">인천</option>
          <option value="Gwangju">광주</option>
          <option value="Ulsan">울산</option>
          <option value="Suwon">수원</option>
        </select>
        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="popular">인기순</option>
          <option value="latest">최신순</option>
        </select>
      </div>
      {/* TOP3 강조 */}
      {isPopular && top3.map((outfit, idx) => (
        <FeedCard
          key={outfit.id}
          record={outfit}
          currentUserUid={user?.uid}
          onToggleLike={handleToggleLike}
          rank={idx + 1}
        />
      ))}
      {/* 나머지 */}
      {(!isPopular ? outfits : rest).map(outfit => (
        <FeedCard
          key={outfit.id}
          record={outfit}
          currentUserUid={user?.uid}
          onToggleLike={handleToggleLike}
        />
      ))}
    </div>
  );
}

export default Feed;
  