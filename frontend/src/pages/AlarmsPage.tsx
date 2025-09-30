import { Card, List, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../api/client';

interface Alarm {
  id: string;
  type: string;
  payload?: Record<string, unknown> | null;
  raisedAt: string;
  vehicle: { id: string; plateNumber: string };
}

const buildSocket = () => {
  const base = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';
  return io(base);
};

export const AlarmsPage = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    let socket: Socket | null = null;

    const load = async () => {
      const response = await api.get<Alarm[]>('/alarm', { params: { limit: 50 } });
      setAlarms(response.data);
    };

    load();

    socket = buildSocket();
    socket.on('vehicle/alarm', (alarm: Alarm) => {
      setAlarms((current) => [alarm, ...current].slice(0, 50));
    });

    return () => socket?.disconnect();
  }, []);

  return (
    <Card title="告警列表">
      <List
        dataSource={alarms}
        renderItem={(alarm) => (
          <List.Item>
            <Tag color="volcano">{alarm.type}</Tag>
            <span style={{ marginLeft: 16 }}>{alarm.vehicle.plateNumber}</span>
            <span style={{ marginLeft: 16 }}>{new Date(alarm.raisedAt).toLocaleString()}</span>
            {alarm.payload ? (
              <code style={{ marginLeft: 'auto' }}>{JSON.stringify(alarm.payload)}</code>
            ) : null}
          </List.Item>
        )}
      />
    </Card>
  );
};
