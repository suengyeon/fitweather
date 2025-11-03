import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext"; 
import { db } from "../firebase";

/**
 * useUserProfile 커스텀 훅 - 현재 로그인된 사용자의 Firestore 프로필 데이터(닉네임, 지역, 공개 여부 등) 불러옴
 */
export default function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 사용자 정보 없으면 로딩 종료 후 즉시 종료
    if (!user || !user.uid) {
      console.log('useUserProfile: 사용자 정보가 없습니다.', { user });
      setProfile(null);
      setLoading(false);
      return;
    }

    /**
     * Firestore에서 프로필 데이터를 비동기적으로 가져오는 함수
     */
    const fetch = async () => {
      try {
        console.log('useUserProfile: 사용자 정보 가져오기 시작', { uid: user.uid });
        // 2. 'users' 컬렉션에서 사용자 UID로 문서 참조 및 조회
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref); 

        if (snap.exists()) {
          const data = snap.data();
          console.log('useUserProfile: 사용자 데이터 가져옴', data);
          // 3. 필요한 데이터만 추출하여 프로필 상태에 저장(region, isPublic 기본값 설정 포함)
          setProfile({
            nickname: data.nickname,
            region: data.region || "Seoul", 
            isPublic: data.isPublic || false, 
          });
        } else {
          console.log('useUserProfile: 사용자 데이터가 존재하지 않음');
          setProfile(null); // 문서가 없으면 null 설정
        }
      } catch (e) {
        console.error("🔥 useUserProfile error", e);
        setProfile(null); // 에러 발생 시 프로필 초기화
      }
      // 4. 로딩 상태 해제(데이터 로드 시도 완료)
      setLoading(false);
    };

    fetch(); // 데이터 가져오기 함수 실행
  }, [user]); // user 객체가 변경될 때마다(로그인/로그아웃 시) 재실행

  // 최종적으로 프로필 데이터&로딩 상태 반환
  return { profile, loading };
}