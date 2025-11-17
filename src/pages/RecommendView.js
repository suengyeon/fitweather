import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, HomeIcon } from "@heroicons/react/24/solid";
import MenuSidebar from "../components/MenuSidebar";
import FeedCard from "../components/FeedCard";
import { getAllRecords } from "../api/getAllRecords";
import { toggleLike } from "../api/toggleLike";
import { sortRecords } from "../utils/sortingUtils";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getReactionSummary } from "../api/reactions";

/**
 * RecommendView 컴포넌트 - 추천 코디를 보여주는 페이지 (수치 필터 적용)
 */
function RecommendView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allOutfits, setAllOutfits] = useState([]);
  const [filteredOutfits, setFilteredOutfits] = useState([]);
  const [filters, setFilters] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 체크박스 필터 상태
  const [excludeMyRecords, setExcludeMyRecords] = useState(false);
  const [onlyMyRecords, setOnlyMyRecords] = useState(false);
  const [likedOnly, setLikedOnly] = useState(false);
  const [onlySubscribedUsers, setOnlySubscribedUsers] = useState(false);
  
  // 구독한 사용자 ID 목록
  const [subscribedUsers, setSubscribedUsers] = useState([]);
  // 내가 좋아요한 기록 ID 목록
  const [likedRecordIds, setLikedRecordIds] = useState([]);

  // 사용자 필터 설정 불러오기
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const fetchFilters = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.filters) {
            setFilters(data.filters);
          } else {
            // 필터가 없으면 기본값 설정 (모든 범위 허용)
            setFilters({
              tempRange: { min: 0, max: 100 },
              rainRange: { min: 0, max: 100 },
              humidityRange: { min: 0, max: 100 }
            });
          }
        } else {
          // 사용자 문서가 없으면 기본값 설정
          setFilters({
            tempRange: { min: 0, max: 100 },
            rainRange: { min: 0, max: 100 },
            humidityRange: { min: 0, max: 100 }
          });
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
        // 에러 발생 시 기본값 설정
        setFilters({
          tempRange: { min: 0, max: 100 },
          rainRange: { min: 0, max: 100 },
          humidityRange: { min: 0, max: 100 }
        });
      }
    };
    fetchFilters();
  }, [user]);

  // 구독한 사용자 목록 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchSubscribedUsers = async () => {
      try {
        const followsQuery = query(
          collection(db, "follows"),
          where("followerId", "==", user.uid)
        );
        
        const followsSnapshot = await getDocs(followsQuery);
        const followingIds = followsSnapshot.docs.map(doc => doc.data().followingId);
        
        setSubscribedUsers(followingIds);
      } catch (error) {
        console.error("❌ 구독 사용자 목록 조회 실패:", error);
        setSubscribedUsers([]); 
      }
    };
    fetchSubscribedUsers();
  }, [user]);

  // 내가 좋아요한 기록 ID 목록 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchLikedRecords = async () => {
      try {
        const reactionsQuery = query(
          collection(db, "reactions"),
          where("uid", "==", user.uid),
          where("type", "==", "up")
        );
        
        const reactionsSnapshot = await getDocs(reactionsQuery);
        const likedIds = reactionsSnapshot.docs.map(doc => doc.data().recordId);
        
        setLikedRecordIds(likedIds);
      } catch (error) {
        console.error("❌ 좋아요 기록 목록 조회 실패:", error);
        setLikedRecordIds([]); 
      }
    };
    fetchLikedRecords();
  }, [user]);

  // 모든 기록 가져오기 및 좋아요 수 로드
  useEffect(() => {
    const fetchAllRecords = async () => {
      try {
        const records = await getAllRecords();
        
        // 각 기록의 좋아요/싫어요 수를 가져와서 추가
        const recordsWithReactions = await Promise.all(
          records.map(async (record) => {
            try {
              const reactionSummary = await getReactionSummary(record.id);
              return {
                ...record,
                thumbsUpCount: reactionSummary.thumbsUpCount || 0,
                thumbsDownCount: reactionSummary.thumbsDownCount || 0,
              };
            } catch (error) {
              console.error(`Error fetching reaction for record ${record.id}:`, error);
              return {
                ...record,
                thumbsUpCount: record.thumbsUpCount || 0,
                thumbsDownCount: record.thumbsDownCount || 0,
              };
            }
          })
        );
        
        setAllOutfits(recordsWithReactions);
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };
    fetchAllRecords();
  }, []);

  // 필터 적용
  useEffect(() => {
    if (!filters || allOutfits.length === 0) {
      setFilteredOutfits([]);
      setIsLoading(false);
      return;
    }

    const filtered = allOutfits.filter((record) => {
      // 나의 기록 제외/만 필터
      if (excludeMyRecords && user?.uid && record.uid === user.uid) return false;
      if (onlyMyRecords && (!user?.uid || record.uid !== user.uid)) return false;

      // 내가 좋아요 한 코디 필터
      if (likedOnly && (!user?.uid || !likedRecordIds.includes(record.id))) return false;

      // 구독한 사람만 필터
      if (onlySubscribedUsers && (!user?.uid || !subscribedUsers.includes(record.uid))) return false;

      // 온도 필터링
      const recordTemp = record.weather?.temp ?? record.temp;
      if (recordTemp !== null && recordTemp !== undefined) {
        const temp = parseFloat(recordTemp);
        if (isNaN(temp) || temp < filters.tempRange.min || temp > filters.tempRange.max) {
          return false;
        }
      }

      // 강수량 필터링
      const recordRain = record.weather?.rain ?? record.rain;
      if (recordRain !== null && recordRain !== undefined) {
        const rain = parseFloat(recordRain);
        if (isNaN(rain) || rain < filters.rainRange.min || rain > filters.rainRange.max) {
          return false;
        }
      }

      // 습도 필터링
      const recordHumidity = record.weather?.humidity ?? record.humidity;
      if (recordHumidity !== null && recordHumidity !== undefined) {
        const humidity = parseFloat(recordHumidity);
        if (isNaN(humidity) || humidity < filters.humidityRange.min || humidity > filters.humidityRange.max) {
          return false;
        }
      }

      return true;
    });

    // 인기순으로 정렬
    const sortedFiltered = sortRecords(filtered, "popular");
    setFilteredOutfits(sortedFiltered);
    setIsLoading(false);
  }, [allOutfits, filters, excludeMyRecords, onlyMyRecords, likedOnly, likedRecordIds, onlySubscribedUsers, subscribedUsers, user]);

  // 좋아요 토글 핸들러
  const handleToggleLike = async (recordId) => {
    if (!user) return;
    try {
      await toggleLike(recordId, user.uid);
      
      // 좋아요 수 다시 가져오기
      const reactionSummary = await getReactionSummary(recordId);
      
      // 기록 목록 업데이트
      setAllOutfits((prev) =>
        prev.map((outfit) => {
          if (outfit.id === recordId) {
            const isLiked = outfit.likes?.includes(user.uid) || false;
            return {
              ...outfit,
              likes: isLiked
                ? outfit.likes.filter((uid) => uid !== user.uid)
                : [...(outfit.likes || []), user.uid],
              thumbsUpCount: reactionSummary.thumbsUpCount || 0,
              thumbsDownCount: reactionSummary.thumbsDownCount || 0,
            };
          }
          return outfit;
        })
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 메뉴 사이드바 */}
      <MenuSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center px-4 py-3 bg-blue-100 shadow">
        <button
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">추천 코디</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-200 px-3 py-1 rounded-md hover:bg-blue-300"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 뒤로가기 버튼 */}
      <div className="flex justify-between items-center px-4 py-3 bg-white shadow-sm">
        <button
              onClick={() => navigate("/recommend-filter-settings")}
              className="bg-blue-400 hover:bg-blue-500 px-4 py-1.5 rounded text-white text-sm"
            >
              필터 설정
            </button>
        <button
          onClick={() => navigate("/recommend")}
          className="bg-gray-400 hover:bg-gray-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-2"
        >
         상세 필터 → 
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">

          {/* 체크박스 필터 (왼쪽 상단) */}
          <div className="mb-4 flex gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="excludeMyRecords"
                checked={excludeMyRecords}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setExcludeMyRecords(checked);
                  // "나의 기록만"과 상호 배타적
                  if (checked) {
                    setOnlyMyRecords(false);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="excludeMyRecords" className="ml-2 text-sm text-gray-700">
                나의 기록 제외
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="onlyMyRecords"
                checked={onlyMyRecords}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOnlyMyRecords(checked);
                  // "나의 기록 제외", "내가 좋아요 한 코디", "구독한 사람만"과 상호 배타적
                  if (checked) {
                    setExcludeMyRecords(false);
                    setLikedOnly(false);
                    setOnlySubscribedUsers(false);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="onlyMyRecords" className="ml-2 text-sm text-gray-700">
                나의 기록만
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="likedOnly"
                checked={likedOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setLikedOnly(checked);
                  // "나의 기록만"과 상호 배타적
                  if (checked) {
                    setOnlyMyRecords(false);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="likedOnly" className="ml-2 text-sm text-gray-700">
                내가 좋아요 한 코디
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="onlySubscribedUsers"
                checked={onlySubscribedUsers}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOnlySubscribedUsers(checked);
                  // "나의 기록만"과 상호 배타적
                  if (checked) {
                    setOnlyMyRecords(false);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="onlySubscribedUsers" className="ml-2 text-sm text-gray-700">
                내가 구독한 사람만
              </label>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              총 {filteredOutfits.length}개의 코디
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              인기순으로 정렬된 추천 코디입니다.
            </p>
            {filters && (
              <div className="text-xs text-gray-500 mt-2">
                필터 범위: 온도 {filters.tempRange.min}~{filters.tempRange.max}°C, 
                강수량 {filters.rainRange.min}~{filters.rainRange.max}mm, 
                습도 {filters.humidityRange.min}~{filters.humidityRange.max}%
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">로딩 중...</p>
            </div>
          ) : filteredOutfits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">필터 조건에 맞는 코디가 없습니다</p>
              <p className="text-sm text-gray-400">
                필터 설정을 조정해보세요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredOutfits.map((outfit) => (
                <FeedCard
                  key={outfit.id}
                  record={outfit}
                  currentUserUid={user?.uid}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecommendView;

