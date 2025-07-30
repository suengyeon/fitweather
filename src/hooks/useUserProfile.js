// src/hooks/useUserProfile.js
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";

export default function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          // 데이터베이스에 저장된 영문 지역명을 그대로 사용
          setProfile({
            nickname: data.nickname,
            region: data.region || "Seoul", // 기본값으로 Seoul 설정
          });
        }
      } catch (e) {
        console.error("🔥 useUserProfile error", e);
        setProfile(null);
      }
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { profile, loading };
}
