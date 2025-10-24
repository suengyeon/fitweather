/**
 * 기존 'basic' 스타일을 '베이직/놈코어'로 변경하는 유틸리티
 */

import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * outfits 컬렉션의 basic 스타일을 베이직/놈코어로 변경
 */
export async function updateOutfitsBasicStyle() {
  try {
    console.log("🔄 outfits 컬렉션에서 'basic' 스타일 업데이트 시작...");
    
    const q = query(
      collection(db, "outfits"),
      where("style", "==", "basic")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 'basic' 스타일을 가진 outfits 기록: ${querySnapshot.size}개`);
    
    const updatePromises = [];
    querySnapshot.forEach((docSnapshot) => {
      const updatePromise = updateDoc(doc(db, "outfits", docSnapshot.id), {
        style: "베이직/놈코어"
      });
      updatePromises.push(updatePromise);
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ outfits 컬렉션 ${querySnapshot.size}개 기록 업데이트 완료`);
    
    return querySnapshot.size;
  } catch (error) {
    console.error("❌ outfits 컬렉션 업데이트 실패:", error);
    return 0;
  }
}

/**
 * records 컬렉션의 basic 스타일을 베이직/놈코어로 변경
 */
export async function updateRecordsBasicStyle() {
  try {
    console.log("🔄 records 컬렉션에서 'basic' 스타일 업데이트 시작...");
    
    const q = query(
      collection(db, "records"),
      where("style", "==", "basic")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 'basic' 스타일을 가진 records 기록: ${querySnapshot.size}개`);
    
    const updatePromises = [];
    querySnapshot.forEach((docSnapshot) => {
      const updatePromise = updateDoc(doc(db, "records", docSnapshot.id), {
        style: "베이직/놈코어"
      });
      updatePromises.push(updatePromise);
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ records 컬렉션 ${querySnapshot.size}개 기록 업데이트 완료`);
    
    return querySnapshot.size;
  } catch (error) {
    console.error("❌ records 컬렉션 업데이트 실패:", error);
    return 0;
  }
}

/**
 * 모든 컬렉션의 basic 스타일을 베이직/놈코어로 변경
 */
export async function updateAllBasicStyles() {
  try {
    console.log("🚀 모든 컬렉션의 'basic' 스타일 업데이트 시작...");
    
    const outfitsCount = await updateOutfitsBasicStyle();
    const recordsCount = await updateRecordsBasicStyle();
    
    const totalCount = outfitsCount + recordsCount;
    console.log(`🎉 전체 업데이트 완료: ${totalCount}개 기록 변경`);
    
    return totalCount;
  } catch (error) {
    console.error("❌ 전체 업데이트 실패:", error);
    return 0;
  }
}
