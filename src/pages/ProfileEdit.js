import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { HomeIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { useAuth } from "../contexts/AuthContext";
import { regionMap } from "../constants/regionData";

/**
 * ProfileEdit 컴포넌트 - 기존 사용자가 닉네임과 지역을 수정하는 페이지
 */
function ProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 입력 필드 상태
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // 지역 이름을 대문자 시작으로 포맷하는 함수(Firestore 저장 위해)
  function capitalizeRegion(region) {
    if (!region) return "";
    return region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
  }

  // 사용자 정보 불러오기
  useEffect(() => {
    if (!user || !user.uid) {
      navigate("/mypage_userinfo");
      return;
    }

    const fetchProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setNickname(data.nickname || "");
          setRegion(data.region || "");
          setEmail(data.email || "");
          setGender(data.gender || "");
        } else {
          setError("사용자 정보를 찾을 수 없습니다.");
        }
      } catch (err) {
        console.error('프로필 불러오기 오류:', err);
        setError("프로필을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  // 저장 버튼 클릭 핸들러
  const handleSave = async () => {
    // 필수 입력 검사
    if (!nickname || !region) {
      setError("닉네임과 지역을 모두 입력해주세요!");
      return;
    }

    try {
      // 닉네임 중복 검사 (자기 자신 제외)
      const nicknameQuery = query(
        collection(db, "users"),
        where("nickname", "==", nickname)
      );
      const nicknameSnapshot = await getDocs(nicknameQuery);

      let nicknameDuplicated = false;
      nicknameSnapshot.forEach((docSnap) => {
        if (docSnap.id !== user.uid) nicknameDuplicated = true;
      });

      if (nicknameDuplicated) {
        setError("이미 사용 중인 닉네임입니다!");
        return;
      }

      // Firestore에 저장할 사용자 데이터
      const userData = {
        nickname,
        region: capitalizeRegion(region),
        email: email, // 기존 이메일 유지
        gender, // 성별 정보 저장
        updatedAt: new Date()
      };

      // Firestore 문서 업데이트
      await setDoc(doc(db, "users", user.uid), userData, { merge: true });

      // 마이페이지로 이동
      navigate("/mypage_userinfo");
    } catch (err) {
      console.error('프로필 저장 오류:', err);
      setError("저장 중 에러: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div>로딩중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button 
          onClick={() => navigate("/mypage_userinfo")}
          className="bg-blue-200 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-300"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">회원 정보 수정</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 로고 */}
      <div className="mt-10 flex justify-center">
        <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-col items-center justify-start flex-1 px-4 mt-12">
        <div className="bg-white rounded-lg shadow px-8 py-8 w-full max-w-md mb-8">
          {/* 닉네임 입력 */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">닉네임</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요."
              className="w-full border border-gray-300 px-4 py-2 rounded"
            />
          </div>

          {/* 이메일 표시(수정 불가) */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">이메일</label>
            <input
              value={email}
              disabled
              className="w-full border border-gray-300 px-4 py-2 rounded bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              이메일은 수정할 수 없습니다.
            </p>
          </div>

          {/* 지역 선택 */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">지역</label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded bg-white"
            >
              <option value="">지역을 선택하세요</option>
              {/* 지역 옵션 렌더링 */}
              {Object.entries(regionMap).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 성별 선택 */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">성별</label>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === "male"}
                  onChange={() => setGender("male")}
                  className="form-radio text-indigo-600 h-4 w-4"
                />
                <span className="text-gray-700">남</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === "female"}
                  onChange={() => setGender("female")}
                  className="form-radio text-pink-600 h-4 w-4"
                />
                <span className="text-gray-700">여</span>
              </label>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <div className="flex justify-center gap-4">
            {/* 취소 버튼 */}
            <button
              onClick={() => navigate("/mypage_userinfo")}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded"
            >
              취소
            </button>
            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileEdit;
