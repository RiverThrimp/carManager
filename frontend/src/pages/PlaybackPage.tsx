import { Button, Card, DatePicker, Form, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

interface VehicleResponse {
  id: string;
  plateNumber: string;
}

interface TrackPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  recordedAt: string;
}

interface VehicleOption {
  label: string;
  value: string;
}

export const PlaybackPage = () => {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [data, setData] = useState<TrackPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadVehicles = async () => {
      const response = await api.get<VehicleResponse[]>('/vehicles');
      setVehicles(response.data.map((vehicle) => ({ label: vehicle.plateNumber, value: vehicle.id })));
    };
    loadVehicles();
  }, []);

  const columns: ColumnsType<TrackPoint> = useMemo(
    () => [
      {
        title: '时间',
        dataIndex: 'recordedAt',
        render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')
      },
      { title: '纬度', dataIndex: 'latitude' },
      { title: '经度', dataIndex: 'longitude' },
      { title: '速度(km/h)', dataIndex: 'speed' }
    ],
    []
  );

  const handleSubmit = async (values: { vehicleId: string; range: [Dayjs, Dayjs] }) => {
    setLoading(true);
    try {
      const [start, end] = values.range;
      const response = await api.get(`/track/${values.vehicleId}`, {
        params: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      });
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="轨迹查询">
        <Form layout="inline" onFinish={handleSubmit}>
          <Form.Item name="vehicleId" label="车辆" rules={[{ required: true }]}>
            <Select options={vehicles} style={{ minWidth: 200 }} placeholder="选择车辆" />
          </Form.Item>
          <Form.Item name="range" label="时间范围" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Table rowKey="id" dataSource={data} loading={loading} columns={columns} />
    </Space>
  );
};
