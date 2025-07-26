import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyPageUserInfo() {
  const { user } = useAuth();
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setNickname(userSnap.data().nickname);
        setRegion(userSnap.data().region);
        setEmail(userSnap.data().email);
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="max-w-xs mx-auto mt-12">
      <h2 className="text-xl font-bold mb-4">내 정보</h2>
      <div className="bg-gray-100 rounded p-4 mb-6">
        <div><span className="font-semibold">닉네임:</span> {nickname}</div>
        <div><span className="font-semibold">지역:</span> {region}</div>
        <div className="text-xs text-neutral-500 mt-2">
          <span className="font-semibold">이메일:</span> {email}
        </div>
      </div>
      <button
        className="bg-blue-500 text-white w-full py-2 rounded mb-3"
        onClick={() => navigate("/profile-edit")}
      >


        수정
      </button>
      <button
        className="bg-red-400 text-white w-full py-2 rounded"
        onClick={() => navigate("/withdraw")}
      >
        탈퇴
      </button>
    </div>
  );
}

export default MyPageUserInfo;
