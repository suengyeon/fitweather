// src/components/ProfileGuard.js
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, Outlet } from "react-router-dom";

export default function ProfileGuard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const checkProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists() || !snap.data().nickname || !snap.data().region) {
          navigate("/profile-setup");
        }
      }
      setLoading(false);
    };
    checkProfile();
  }, [auth, navigate]);

  if (loading) return <div>로딩중...</div>;
  return <Outlet />;
}
