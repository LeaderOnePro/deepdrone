import React, { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * 虚拟滚动列表组件
 */
const VirtualList = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  style = {}
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = start + visibleCount;

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);

  // 总高度
  const totalHeight = items.length * itemHeight;

  // 滚动处理
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        ...style
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(VirtualList);