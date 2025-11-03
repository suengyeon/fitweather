import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 피드 상세 데이터(outfits/records) 및 작성자 정보를 가져오는 Custom Hook.
 */
export const useFeedDetailData = (id) => {
    const [data, setData] = useState(null); 
    const [author, setAuthor] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [formattedDate, setFormattedDate] = useState("");

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. 'outfits' 컬렉션에서 데이터 조회 시도
                const outfitsRef = doc(db, "outfits", id);
                let record = null;
                let dataSnapshot = await getDoc(outfitsRef);

                if (dataSnapshot.exists()) {
                    record = dataSnapshot.data();
                } else {
                    // 2. 'outfits'에 없으면 'records' 컬렉션에서 데이터 조회 시도
                    const recordsRef = doc(db, "records", id);
                    dataSnapshot = await getDoc(recordsRef);
                    if (dataSnapshot.exists()) {
                        record = dataSnapshot.data();
                    }
                }

                if (record) {
                    setData(record);

                    // 날짜 포매팅(YYYY년 MM월 DD일 형식)
                    if (record.date) {
                        const [year, month, day] = record.date.split('-').map(Number);
                        let dateString = `${year}년 ${month}월 ${day}일`;
                        if (record.recordedTime) dateString += ` ${record.recordedTime}`;
                        setFormattedDate(dateString);
                    }

                    // 작성자 정보(users 컬렉션에서 uid 기반으로 조회)
                    const userRef = doc(db, "users", record.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setAuthor({ ...userSnap.data(), uid: record.uid });
                    } else {
                        // 사용자 문서가 없는 경우, 기본값(uid) 사용
                        setAuthor({ nickname: record.uid, uid: record.uid }); 
                    }
                } else {
                    setData(null);
                    setAuthor(null);
                }

            } catch (error) {
                console.error("데이터 조회 중 오류:", error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]); // id가 변경될 때마다 데이터를 다시 불러옴

    return { data, author, loading, formattedDate };
};