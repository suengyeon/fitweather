import { useAuth } from "../contexts/AuthContext";
import { db, logout, auth } from "../firebase";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { useState } from "react";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";

function Withdraw() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleWithdraw = async () => {
    if (!window.confirm("정말로 회원 탈퇴하시겠습니까? 모든 정보가 삭제됩니다.")) return;
    
    try {
      console.log("탈퇴 시작:", { uid: user.uid, provider: user.provider });
      
      // 🔴 1. Provider에 따른 재인증 처리
      if (user.provider === 'google') {
        console.log("Google 사용자 재인증 시작");
        const provider = new GoogleAuthProvider();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          await reauthenticateWithPopup(currentUser, provider);
          console.log("Google 재인증 완료");
        } else {
          throw new Error("Firebase Auth 사용자를 찾을 수 없습니다.");
        }
      } else {
        console.log("카카오 사용자 - 재인증 생략");
      }

      // 🔵 2. 사용자의 모든 기록(records) 삭제
      console.log("사용자 기록 삭제 시작");
      const recordsQuery = query(collection(db, "records"), where("uid", "==", user.uid));
      const recordsSnapshot = await getDocs(recordsQuery);
      
      if (recordsSnapshot.size > 0) {
        const deletePromises = recordsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`사용자 기록 ${recordsSnapshot.size}개 삭제 완료`);
      } else {
        console.log("삭제할 사용자 기록이 없습니다.");
      }

      // 🔵 3. Firestore 회원정보 삭제
      console.log("Firestore 사용자 정보 삭제 시작");
      await deleteDoc(doc(db, "users", user.uid));
      console.log("Firestore 사용자 정보 삭제 완료");
      
      // 🔵 4. 계정 삭제 (Google 사용자만, 선택적)
      if (user.provider === 'google') {
        console.log("Firebase Auth 계정 삭제 시작");
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            await currentUser.delete();
            console.log("Firebase Auth 계정 삭제 완료");
          } catch (deleteError) {
            console.warn("Firebase Auth 계정 삭제 실패, 앱 데이터만 삭제:", deleteError);
            // Firebase Auth 계정 삭제가 실패해도 앱 데이터는 이미 삭제되었으므로 계속 진행
          }
        } else {
          console.log("Firebase Auth 사용자가 이미 로그아웃되었습니다.");
        }
      }
      
      setInfoMsg("회원탈퇴 완료. 모든 정보가 삭제되었습니다.");
      console.log("탈퇴 완료");
      
      setTimeout(() => {
        logout();
        navigate("/login"); // 로그인 페이지로 이동
      }, 1500);
      
    } catch (err) {
      console.error("탈퇴 중 에러:", err);
      
      // 에러 메시지를 더 구체적으로 표시
      let errorMessage = "탈퇴 중 에러가 발생했습니다.";
      
      if (err.code === 'auth/requires-recent-login') {
        errorMessage = "보안을 위해 다시 로그인해주세요.";
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = "사용자 정보를 찾을 수 없습니다.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">회원탈퇴</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-10 flex justify-center">
          <h1 className="text-5xl font-lilita text-indigo-500">Fitweather</h1>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex flex-col items-center justify-start flex-1 px-4 mt-12">
        {/* 안내 메시지 카드 */}
        <div className="bg-white rounded-lg shadow px-8 py-8 w-full max-w-xl mb-8">
          <div className="text-center text-black text-base leading-relaxed">
            <p className="font-semibold">회원탈퇴 시 모든 정보가 삭제되며, 복구할 수 없습니다.</p>
            <p className="mt-2">정말 탈퇴하시겠습니까?</p>
            {user?.provider === 'kakao' && (
              <p className="mt-2 text-sm text-gray-600">
                카카오 계정으로 가입하신 경우, 앱에서만 탈퇴되며 카카오 계정은 유지됩니다.
              </p>
            )}
          </div>
        </div>

        {/* ✅ 버튼 그룹: 카드 외부 */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={handleWithdraw}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md"
          >
            동의
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-md"
          >
            이전
          </button>
        </div>

        {/* 메시지 출력 */}
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        {infoMsg && <p className="text-black mt-2 text-sm">{infoMsg}</p>}
      </div>
    </div>
  );
}

export default Withdraw;
