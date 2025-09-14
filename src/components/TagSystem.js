// 태그 시스템 컴포넌트

import React, { useState, useEffect } from 'react';
import { getPopularTags, getPostsByTag } from '../utils/communityUtils';

// 태그 입력 컴포넌트
export function TagInput({ selectedTags, onTagsChange, maxTags = 5, placeholder = "태그를 입력하세요..." }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 인기 태그 로드
  useEffect(() => {
    loadPopularTags();
  }, []);

  const loadPopularTags = async () => {
    try {
      const popularTags = await getPopularTags(20);
      setSuggestions(popularTags.map(tag => tag.tag));
    } catch (error) {
      console.error('인기 태그 로드 오류:', error);
    }
  };

  // 태그 추가
  const addTag = (tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, trimmedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  // 태그 제거
  const removeTag = (tagToRemove) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // 입력 처리
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim()) {
      const filteredSuggestions = suggestions.filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) && 
        !selectedTags.includes(tag.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 키보드 이벤트
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className="relative">
      {/* 선택된 태그들 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* 태그 입력 */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={selectedTags.length >= maxTags ? "최대 태그 수에 도달했습니다" : placeholder}
          disabled={selectedTags.length >= maxTags}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* 태그 제안 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
            {suggestions.slice(0, 10).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => addTag(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
              >
                #{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 태그 개수 표시 */}
      <div className="text-xs text-gray-500 mt-1">
        {selectedTags.length}/{maxTags} 태그
      </div>
    </div>
  );
}

// 태그 목록 컴포넌트
export function TagList({ tags, onTagClick, showCount = false, size = 'medium' }) {
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-2'
  };

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <button
          key={index}
          onClick={() => onTagClick?.(tag)}
          className={`
            ${sizeClasses[size]}
            bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors
            ${onTagClick ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          #{tag}
          {showCount && typeof tag === 'object' && tag.count && (
            <span className="ml-1 text-gray-500">({tag.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

// 인기 태그 컴포넌트
export function PopularTags({ onTagClick, limit = 20 }) {
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopularTags();
  }, [limit]);

  const loadPopularTags = async () => {
    setLoading(true);
    try {
      const tags = await getPopularTags(limit);
      setPopularTags(tags);
    } catch (error) {
      console.error('인기 태그 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-full animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">인기 태그</h3>
      <div className="flex flex-wrap gap-2">
        {popularTags.map((tag, index) => (
          <button
            key={index}
            onClick={() => onTagClick?.(tag.tag)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            #{tag.tag}
            <span className="text-blue-600 text-xs">({tag.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 태그 검색 결과 컴포넌트
export function TagSearchResults({ tag, onPostClick }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tag) {
      loadPostsByTag();
    }
  }, [tag]);

  const loadPostsByTag = async () => {
    setLoading(true);
    try {
      const tagPosts = await getPostsByTag(tag);
      setPosts(tagPosts);
    } catch (error) {
      console.error('태그 검색 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-500 mt-2">검색 중...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        #{tag} 태그 게시물 ({posts.length}개)
      </h2>
      
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onPostClick?.(post)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Outfit"
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                    {post.author?.nickname?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium">{post.author?.nickname || '익명'}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{post.outfit || '착장 정보 없음'}</p>
                <TagList tags={post.styleTags} size="small" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>#{tag} 태그로 등록된 게시물이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

// 태그 클라우드 컴포넌트
export function TagCloud({ onTagClick, maxTags = 50 }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, [maxTags]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const popularTags = await getPopularTags(maxTags);
      setTags(popularTags);
    } catch (error) {
      console.error('태그 클라우드 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagSize = (count, maxCount) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-2xl';
    if (ratio > 0.6) return 'text-xl';
    if (ratio > 0.4) return 'text-lg';
    if (ratio > 0.2) return 'text-base';
    return 'text-sm';
  };

  const getTagColor = (count, maxCount) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-blue-800';
    if (ratio > 0.6) return 'text-blue-700';
    if (ratio > 0.4) return 'text-blue-600';
    if (ratio > 0.2) return 'text-blue-500';
    return 'text-blue-400';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-500 mt-2">태그 클라우드 로딩 중...</p>
      </div>
    );
  }

  const maxCount = Math.max(...tags.map(tag => tag.count));

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">태그 클라우드</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {tags.map((tag, index) => (
          <button
            key={index}
            onClick={() => onTagClick?.(tag.tag)}
            className={`
              ${getTagSize(tag.count, maxCount)}
              ${getTagColor(tag.count, maxCount)}
              hover:underline transition-all duration-200
            `}
          >
            #{tag.tag}
          </button>
        ))}
      </div>
    </div>
  );
}

