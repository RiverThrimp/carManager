import axios from 'axios';
import type { PositionMessage } from '../lib/parser';

const client = axios.create({
  baseURL: process.env.API_BASE_URL ?? 'http://localhost:4000/api',
  timeout: 5000
});

client.interceptors.request.use((config) => {
  const token = process.env.API_TOKEN;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const forwardPosition = async (message: PositionMessage) => {
  await client.post(`/positions/${message.deviceId}`, {
    latitude: message.lat,
    longitude: message.lng,
    speed: message.speed,
    direction: message.direction,
    recordedAt: message.time
  });
};

export const forwardAlarm = async (message: PositionMessage) => {
  if (message.alarms === 0) {
    return;
  }

  await client.post('/alarm', {
    vehicleId: message.deviceId,
    type: 'JT808_ALARM',
    payload: { alarms: message.alarms, status: message.status },
    raisedAt: message.time
  });
};
