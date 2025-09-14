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
    if (!user || !user.uid) {
      console.log('useUserProfile: 사용자 정보가 없습니다.', { user });
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        console.log('useUserProfile: 사용자 정보 가져오기 시작', { uid: user.uid });
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          console.log('useUserProfile: 사용자 데이터 가져옴', data);
          // 데이터베이스에 저장된 영문 지역명을 그대로 사용
          setProfile({
            nickname: data.nickname,
            region: data.region || "Seoul", // 기본값으로 Seoul 설정
            isPublic: data.isPublic || false, // 캘린더 공개 여부
          });
        } else {
          console.log('useUserProfile: 사용자 데이터가 존재하지 않음');
          setProfile(null);
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
