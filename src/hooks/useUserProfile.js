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
          const region = data.region === "서울" ? "Seoul" : data.region === "부산" ? "Busan" : "Seoul";
          setProfile({
            nickname: data.nickname,
            region,
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
