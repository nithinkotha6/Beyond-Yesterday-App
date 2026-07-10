'use client';

import ReactECharts from 'echarts-for-react';
import { Users, ChevronDown } from 'lucide-react';

export type ChartUser = {
  name: string;
  color: string;
  avatar_url: string;
  data: number[]; // 7 values, index 0 = MON
};

interface MetricChartProps {
  users: ChartUser[];
  title?: string;
  days?: string[]; // x-axis labels
}

const DEFAULT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const COLOR_PALETTE = ['#FF3B30', '#007AFF', '#AF52DE', '#34C759', '#FFCC00'];

/**
 * ECharts multi-series line chart — live data only, no mock arrays.
 * Spec: Features.md §4, frontend.md §4
 */
export default function MetricChart({
  users,
  title = 'Weekly Progress',
  days = DEFAULT_DAYS,
}: MetricChartProps) {
  const hasData = users.length > 0;

  const option = {
    grid: { left: 36, right: 72, top: 16, bottom: 28, containLabel: false },
    xAxis: {
      type: 'category',
      data: days,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: 600 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
      splitLine: {
        lineStyle: { type: 'dashed', color: '#F3F4F6', width: 1 },
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#E5E7EB', width: 1 } },
      backgroundColor: '#fff',
      borderColor: '#E5E7EB',
      textStyle: { color: '#111827', fontSize: 12 },
    },
    series: users.map((u, idx) => {
      const color = u.color || COLOR_PALETTE[idx % COLOR_PALETTE.length];
      return {
        type: 'line',
        name: u.name,
        smooth: true,
        symbol: 'circle',
        lineStyle: { color, width: 2.5 },
        data: u.data.map((v, i) => {
          const isLast = i === days.length - 1;
          const terminalSymbol =
            isLast && u.avatar_url && u.avatar_url.startsWith('http')
              ? `image://${u.avatar_url}`
              : 'circle';
          return {
            value: v,
            symbol: terminalSymbol,
            symbolSize: isLast ? 30 : 0,
            itemStyle: isLast
              ? { color, borderColor: '#fff', borderWidth: 3 }
              : { opacity: 0 },
            label: {
              show: isLast,
              position: 'right',
              formatter: `${v}`,
              fontWeight: 'bold',
              fontSize: 14,
              color: '#111827',
            },
          };
        }),
      };
    }),
  };

  return (
    <div className="rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
      {/* Card header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#111827]">{title}</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">Weekly Progress</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F7F8FA] rounded-lg px-3 py-1.5 font-medium hover:bg-gray-100 transition-colors">
          <Users size={12} />
          All Athletes
          <ChevronDown size={11} />
        </button>
      </div>

      {hasData ? (
        <ReactECharts
          option={option}
          style={{ height: 272, width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      ) : (
        <div className="h-[272px] flex flex-col items-center justify-center gap-2 text-center">
          <svg
            viewBox="0 0 48 48" fill="none"
            className="w-10 h-10 text-[#E5E7EB]"
          >
            <path
              d="M6 36 L14 24 L22 29 L30 16 L38 20 L46 10"
              stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm font-semibold text-[#9CA3AF]">No activity yet</p>
          <p className="text-xs text-[#D1D5DB]">
            Log your first activity to see it here.
          </p>
        </div>
      )}
    </div>
  );
}
