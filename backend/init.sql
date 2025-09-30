-- 初始化数据库：fleet_platform
CREATE DATABASE fleet_platform;

\c fleet_platform;

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
);

-- 司机表
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    license_no VARCHAR(50)
);

-- 车辆表
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    driver_id INT REFERENCES drivers(id),
    status VARCHAR(20) DEFAULT 'offline'
);

-- 轨迹点表
CREATE TABLE positions (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    direction INT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 告警表
CREATE TABLE alarms (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id),
    type VARCHAR(50) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 日报表
CREATE TABLE reports_daily (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id),
    date DATE NOT NULL,
    mileage DOUBLE PRECISION DEFAULT 0,
    working_hours DOUBLE PRECISION DEFAULT 0
);

-- 月报表
CREATE TABLE reports_monthly (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id),
    month VARCHAR(7) NOT NULL, -- 格式 YYYY-MM
    mileage DOUBLE PRECISION DEFAULT 0,
    attendance_days INT DEFAULT 0
);
