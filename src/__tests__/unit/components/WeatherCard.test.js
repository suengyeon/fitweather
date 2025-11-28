/**
 * WeatherCard 컴포넌트 단위 테스트
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WeatherCard from '../../../components/WeatherCard';

describe('WeatherCard', () => {
  const defaultProps = {
    temp: 20,
    rain: 0,
    humidity: 60,
    icon: 'sunny'
  };

  test('기본 props로 렌더링', () => {
    render(<WeatherCard {...defaultProps} />);
    
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  test('온도 표시', () => {
    render(<WeatherCard {...defaultProps} temp={25} />);
    
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });

  test('강수량 표시', () => {
    render(<WeatherCard {...defaultProps} rain={5} />);
    
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  test('습도 표시', () => {
    render(<WeatherCard {...defaultProps} humidity={70} />);
    
    expect(screen.getByText(/70/)).toBeInTheDocument();
  });

  test('다양한 날씨 아이콘 표시', () => {
    const { rerender } = render(<WeatherCard {...defaultProps} icon="rain" />);
    expect(screen.getByText('🌧️')).toBeInTheDocument();

    rerender(<WeatherCard {...defaultProps} icon="snow" />);
    expect(screen.getByText('❄️')).toBeInTheDocument();

    rerender(<WeatherCard {...defaultProps} icon="cloudy" />);
    expect(screen.getByText('☁️')).toBeInTheDocument();
  });

  test('onIconClick 핸들러가 있을 때 클릭 이벤트 처리', () => {
    const handleClick = jest.fn();
    render(<WeatherCard {...defaultProps} onIconClick={handleClick} />);
    
    const iconBox = screen.getByText('☀️').closest('div');
    fireEvent.click(iconBox);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('onIconClick이 없을 때 클릭 이벤트 처리 안 함', () => {
    render(<WeatherCard {...defaultProps} />);
    
    const iconBox = screen.getByText('☀️').closest('div');
    expect(iconBox).not.toHaveClass('cursor-pointer');
  });

  test('isRecord가 true일 때 상세 정보 숨김', () => {
    render(<WeatherCard {...defaultProps} isRecord={true} />);
    
    // 온도, 강수량, 습도가 표시되지 않아야 함
    expect(screen.queryByText(/20/)).not.toBeInTheDocument();
  });

  test('isRecord가 false일 때 상세 정보 표시', () => {
    render(<WeatherCard {...defaultProps} isRecord={false} />);
    
    // 아이콘은 표시되어야 함
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  test('bgColor prop 적용', () => {
    const { container } = render(<WeatherCard {...defaultProps} bgColor="bg-blue-100" />);
    
    // 이모지의 부모 div (아이콘 박스)를 찾기
    const emojiElement = screen.getByText('☀️');
    const iconBox = emojiElement.parentElement; // absolute text-8xl div의 부모
    expect(iconBox).toHaveClass('bg-blue-100');
  });

  test('기본 bgColor 사용', () => {
    render(<WeatherCard {...defaultProps} />);
    
    // 이모지의 부모 div (아이콘 박스)를 찾기
    const emojiElement = screen.getByText('☀️');
    const iconBox = emojiElement.parentElement; // absolute text-8xl div의 부모
    expect(iconBox).toHaveClass('bg-gray-100');
  });
});

