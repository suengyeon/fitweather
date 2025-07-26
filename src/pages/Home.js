import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { logout } from "../firebase";
import { useNavigate } from "react-router-dom";

function Home() {
  const { user, loading } = useAuth();
  const [nickname, setNickname] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNickname = async () => {
      if (!user) return;
      setProfileLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setNickname(userSnap.data().nickname);
        } else {
          setNickname("");
        }
      } catch (err) {
        setNickname("");
      }
      setProfileLoading(false);
    };
    fetchNickname();
  }, [user]);

  if (loading || profileLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {user ? (
        <div>
          <h1 className="text-2xl font-bold mb-4">
            환영합니다, {nickname || "회원"}!
          </h1>
          <p>로그인 상태의 홈 화면입니다.</p>
          {/* 내 정보 보기 버튼 (추가) */}
          <button
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
            onClick={() => navigate("/mypage_userinfo")}
          >
            내 정보
          </button>
          <button
            onClick={logout}
            className="mt-4 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-4">FitWeather에 오신 것을 환영합니다!</h1>
          <p>로그인하고 더 많은 기능을 경험해보세요.</p>
          <a
            href="/login"
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block"
          >
            로그인 하러 가기
          </a>
        </div>
      )}
    </div>
  );
}

export default Home;
