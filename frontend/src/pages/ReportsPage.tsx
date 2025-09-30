import { DownloadOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, message, Radio, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ReportTrackMap, type TrackPoint } from '../components/ReportTrackMap';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

interface VehicleRef {
  id: string;
  plateNumber: string;
}

interface DailyReport {
  id: string;
  vehicle: VehicleRef;
  reportDate: string;
  totalDistanceKm: number;
  totalStops: number;
}

interface WeeklyReport {
  id: string;
  vehicle: VehicleRef;
  reportWeek: string;
  weekStart: string;
  weekEnd: string;
  totalDistanceKm: number;
  totalTrips: number;
}

interface MonthlyReport {
  id: string;
  vehicle: VehicleRef;
  reportMonth: string;
  totalDistanceKm: number;
  activeDays: number;
}

interface YearlyReport {
  id: string;
  vehicle: VehicleRef;
  reportYear: string;
  totalDistanceKm: number;
  activeMonths: number;
}

type Mode = 'daily' | 'weekly' | 'monthly' | 'yearly';

type ReportRecord = DailyReport | WeeklyReport | MonthlyReport | YearlyReport;

type FiltersState = {
  daily: Dayjs | null;
  weekly: Dayjs | null;
  monthly: Dayjs | null;
  yearly: Dayjs | null;
};

const initialFilters: FiltersState = {
  daily: null,
  weekly: null,
  monthly: null,
  yearly: null
};

const formatRange = (start: Dayjs, end: Dayjs): [string, string] => [
  start.toDate().toISOString(),
  end.toDate().toISOString()
];

const toRequestRange = (mode: Mode, record: ReportRecord): [string, string] | null => {
  switch (mode) {
    case 'daily': {
      const date = dayjs((record as DailyReport).reportDate);
      if (!date.isValid()) return null;
      return formatRange(date.startOf('day'), date.endOf('day'));
    }
    case 'weekly': {
      const weekly = record as WeeklyReport;
      const start = dayjs(weekly.weekStart);
      const end = dayjs(weekly.weekEnd);
      if (!start.isValid() || !end.isValid()) return null;
      return formatRange(start.startOf('day'), end.endOf('day'));
    }
    case 'monthly': {
      const monthly = record as MonthlyReport;
      const start = dayjs(`${monthly.reportMonth}-01`);
      if (!start.isValid()) return null;
      return formatRange(start.startOf('month'), start.endOf('month'));
    }
    case 'yearly': {
      const yearly = record as YearlyReport;
      const start = dayjs(`${yearly.reportYear}-01-01`);
      if (!start.isValid()) return null;
      return formatRange(start.startOf('year'), start.endOf('year'));
    }
    default:
      return null;
  }
};

const filenameByMode: Record<Mode, string> = {
  daily: 'daily-report',
  weekly: 'weekly-report',
  monthly: 'monthly-report',
  yearly: 'yearly-report'
};

export const ReportsPage = () => {
  const [mode, setMode] = useState<Mode>('daily');
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [dailyData, setDailyData] = useState<DailyReport[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyReport[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyReport[]>([]);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [trackLoading, setTrackLoading] = useState(false);
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState<string>('');

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([fetchDaily(), fetchWeekly(), fetchMonthly(), fetchYearly()]);
      } catch (error) {
        message.error('初始化报表失败');
        console.error(error);
      }
    };

    void bootstrap();
  }, []);

  const fetchDaily = async (date?: Dayjs | null) => {
    const params = date ? { date: date.format('YYYY-MM-DD') } : undefined;
    const response = await api.get<DailyReport[]>('/report/daily', { params });
    setDailyData(response.data);
  };

  const fetchWeekly = async (week?: Dayjs | null) => {
    const params = week ? { week: week.format('GGGG-[W]WW') } : undefined;
    const response = await api.get<WeeklyReport[]>('/report/weekly', { params });
    setWeeklyData(response.data);
  };

  const fetchMonthly = async (month?: Dayjs | null) => {
    const params = month ? { month: month.format('YYYY-MM') } : undefined;
    const response = await api.get<MonthlyReport[]>('/report/monthly', { params });
    setMonthlyData(response.data);
  };

  const fetchYearly = async (year?: Dayjs | null) => {
    const params = year ? { year: year.format('YYYY') } : undefined;
    const response = await api.get<YearlyReport[]>('/report/yearly', { params });
    setYearlyData(response.data);
  };

  const handleModeChange = (value: Mode) => {
    setMode(value);
    setTrackPoints([]);
    setSelectedVehiclePlate('');
  };

  const updateFilter = async (value: Dayjs | null) => {
    try {
      switch (mode) {
        case 'daily':
          setFilters((prev) => ({ ...prev, daily: value }));
          await fetchDaily(value);
          break;
        case 'weekly':
          setFilters((prev) => ({ ...prev, weekly: value }));
          await fetchWeekly(value);
          break;
        case 'monthly':
          setFilters((prev) => ({ ...prev, monthly: value }));
          await fetchMonthly(value);
          break;
        case 'yearly':
          setFilters((prev) => ({ ...prev, yearly: value }));
          await fetchYearly(value);
          break;
        default:
          break;
      }
    } catch (error) {
      message.error('加载报表失败');
      console.error(error);
    }
  };

  const loadTrack = async (modeKey: Mode, record: ReportRecord) => {
    const vehicleId = record.vehicle?.id;
    if (!vehicleId) {
      message.warning('该报表缺少车辆信息');
      return;
    }

    const range = toRequestRange(modeKey, record);
    if (!range) {
      message.warning('无法识别该报表的时间范围');
      return;
    }

    setTrackLoading(true);
    setSelectedVehiclePlate(record.vehicle.plateNumber);
    try {
      const response = await api.get<TrackPoint[]>(`/track/${vehicleId}`, {
        params: { start: range[0], end: range[1] }
      });
      const sanitized = response.data
        .map((point) => ({
          ...point,
          latitude: Number(point.latitude),
          longitude: Number(point.longitude)
        }))
        .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

      setTrackPoints(sanitized);

      if (!sanitized.length) {
        message.info('该时间范围内没有轨迹数据');
      } else if (sanitized.length !== response.data.length) {
        message.warning('部分轨迹坐标无效，已自动忽略');
      }
    } catch (error) {
      message.error('加载轨迹失败');
      console.error(error);
    } finally {
      setTrackLoading(false);
    }
  };

  const handleExport = async () => {
    const exportParams: Record<string, string> = {};
    if (mode === 'daily' && filters.daily) {
      exportParams.date = filters.daily.format('YYYY-MM-DD');
    }
    if (mode === 'weekly' && filters.weekly) {
      exportParams.week = filters.weekly.format('GGGG-[W]WW');
    }
    if (mode === 'monthly' && filters.monthly) {
      exportParams.month = filters.monthly.format('YYYY-MM');
    }
    if (mode === 'yearly' && filters.yearly) {
      exportParams.year = filters.yearly.format('YYYY');
    }

    try {
      const response = await api.get(`/report/${mode}/export`, {
        params: exportParams,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filterSuffix = Object.values(exportParams)[0] ? `-${Object.values(exportParams)[0]}` : '';
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `${filenameByMode[mode]}${filterSuffix}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      message.error('导出报表失败');
      console.error(error);
    }
  };

  const dailyColumns: ColumnsType<DailyReport> = [
    { title: '日期', dataIndex: 'reportDate', render: (value: string) => dayjs(value).format('YYYY-MM-DD') },
    { title: '车辆', dataIndex: ['vehicle', 'plateNumber'] },
    { title: '里程(km)', dataIndex: 'totalDistanceKm' },
    { title: '停车次数', dataIndex: 'totalStops' }
  ];

  const weeklyColumns: ColumnsType<WeeklyReport> = [
    { title: '周次', dataIndex: 'reportWeek' },
    { title: '车辆', dataIndex: ['vehicle', 'plateNumber'] },
    { title: '开始日期', dataIndex: 'weekStart' },
    { title: '结束日期', dataIndex: 'weekEnd' },
    { title: '里程(km)', dataIndex: 'totalDistanceKm' },
    { title: '行程数', dataIndex: 'totalTrips' }
  ];

  const monthlyColumns: ColumnsType<MonthlyReport> = [
    { title: '月份', dataIndex: 'reportMonth' },
    { title: '车辆', dataIndex: ['vehicle', 'plateNumber'] },
    { title: '里程(km)', dataIndex: 'totalDistanceKm' },
    { title: '出勤天数', dataIndex: 'activeDays' }
  ];

  const yearlyColumns: ColumnsType<YearlyReport> = [
    { title: '年份', dataIndex: 'reportYear' },
    { title: '车辆', dataIndex: ['vehicle', 'plateNumber'] },
    { title: '里程(km)', dataIndex: 'totalDistanceKm' },
    { title: '活跃月份', dataIndex: 'activeMonths' }
  ];

  const renderFilterPicker = () => {
    const commonProps = {
      style: { marginLeft: 16 },
      allowClear: true as const,
      value:
        mode === 'daily'
          ? filters.daily
          : mode === 'weekly'
            ? filters.weekly
            : mode === 'monthly'
              ? filters.monthly
              : filters.yearly,
      onChange: updateFilter
    };

    if (mode === 'daily') {
      return <DatePicker {...commonProps} placeholder="选择日期" />;
    }
    if (mode === 'weekly') {
      return <DatePicker picker="week" {...commonProps} placeholder="选择周" />;
    }
    if (mode === 'monthly') {
      return <DatePicker picker="month" {...commonProps} placeholder="选择月份" />;
    }
    return <DatePicker picker="year" {...commonProps} placeholder="选择年份" />;
  };

  const renderTable = () => {
    if (mode === 'daily') {
      return (
        <Table
          rowKey="id"
          dataSource={dailyData}
          columns={dailyColumns}
          onRow={(record) => ({ onClick: () => loadTrack('daily', record) })}
        />
      );
    }
    if (mode === 'weekly') {
      return (
        <Table
          rowKey="id"
          dataSource={weeklyData}
          columns={weeklyColumns}
          onRow={(record) => ({ onClick: () => loadTrack('weekly', record) })}
        />
      );
    }
    if (mode === 'monthly') {
      return (
        <Table
          rowKey="id"
          dataSource={monthlyData}
          columns={monthlyColumns}
          onRow={(record) => ({ onClick: () => loadTrack('monthly', record) })}
        />
      );
    }
    return (
      <Table
        rowKey="id"
        dataSource={yearlyData}
        columns={yearlyColumns}
        onRow={(record) => ({ onClick: () => loadTrack('yearly', record) })}
      />
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Space wrap>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value)}
            options={[
              { label: '日报', value: 'daily' },
              { label: '周报', value: 'weekly' },
              { label: '月报', value: 'monthly' },
              { label: '年报', value: 'yearly' }
            ]}
            optionType="button"
          />
          {renderFilterPicker()}
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出当前报表
          </Button>
        </Space>
      </Card>

      <Card title="报表数据" size="small">
        {renderTable()}
      </Card>

      <Card
        title="轨迹预览"
        size="small"
        extra={selectedVehiclePlate ? `车辆：${selectedVehiclePlate}` : undefined}
      >
        <ReportTrackMap points={trackPoints} loading={trackLoading} />
      </Card>
    </Space>
  );
};
