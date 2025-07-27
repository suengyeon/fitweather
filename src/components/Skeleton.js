export default function Skeleton() {
    return (
        <div className="w-60 h-72 bg-gray-200 border border-gray-300 rounded flex flex-col items-center justify-center gap-2 animate-pulse">
            {/* 아이콘 위치 */}
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            {/* 지역명 */}
            <div className="w-24 h-4 bg-gray-300 rounded"></div>

            {/* 온도 */}
            <div className="w-20 h-6 bg-gray-300 rounded"></div>

            {/* 날씨 설명 */}
            <div className="w-16 h-4 bg-gray-300 rounded"></div>

            {/* 강수량 */}
            <div className="w-24 h-4 bg-gray-300 rounded"></div>
        </div>
    );
}
