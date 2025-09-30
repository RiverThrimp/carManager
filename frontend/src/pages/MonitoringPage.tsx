import { Card, List, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../api/client';

interface Position {
  id: string;
  vehicle: { id: string; plateNumber: string };
  latitude: number;
  longitude: number;
  speed: number;
  direction: number;
  recordedAt: string;
}

const buildSocket = () => {
  const base = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';
  return io(base);
};

export const MonitoringPage = () => {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    let socket: Socket | null = null;

    const loadLatest = async () => {
      const response = await api.get<Position[]>('/track/latest');
      setPositions(response.data);
    };

    loadLatest();

    socket = buildSocket();
    socket.on('vehicle/position', (position: Position) => {
      setPositions((prev) => {
        const filtered = prev.filter((item) => item.vehicle.id !== position.vehicle.id);
        return [{ ...position }, ...filtered].slice(0, 20);
      });
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <Card title="实时车辆位置">
      <List
        bordered
        dataSource={positions}
        renderItem={(item) => (
          <List.Item>
            <Typography.Text strong>{item.vehicle.plateNumber}</Typography.Text>
            <span style={{ marginLeft: 16 }}>
              {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
            </span>
            <span style={{ marginLeft: 16 }}>速度: {item.speed} km/h</span>
            <span style={{ marginLeft: 16 }}>时间: {new Date(item.recordedAt).toLocaleString()}</span>
          </List.Item>
        )}
      />
    </Card>
  );
};
