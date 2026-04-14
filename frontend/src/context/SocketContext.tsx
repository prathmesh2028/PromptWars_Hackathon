"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface QueueEntry {
  name: string;
  zone: string;
  waitTime: number;
}

export interface Insight {
  level: 'critical' | 'warning' | 'info' | 'success';
  message: string;
}

export interface LiveAlert {
  message: string;
  timestamp: string;
}

interface SocketContextData {
  socket: Socket | null;
  isConnected: boolean;
  heatmap: Record<string, number>;
  predictions: Record<string, number>;  // 15-min predicted densities
  totalCrowd: number;
  queues: QueueEntry[];
  insights: Insight[];
  bestPath: string[];
  risk: 'normal' | 'warning' | 'critical';
  timeMul: number;        // current time-of-day activity % (0-100)
  liveAlert: LiveAlert | null;
}

const SocketContext = createContext<SocketContextData>({
  socket: null,
  isConnected: false,
  heatmap: {},
  predictions: {},
  totalCrowd: 0,
  queues: [],
  insights: [],
  bestPath: [],
  risk: 'normal',
  timeMul: 0,
  liveAlert: null,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [totalCrowd, setTotalCrowd] = useState(0);
  const [queues, setQueues] = useState<QueueEntry[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [bestPath, setBestPath] = useState<string[]>([]);
  const [risk, setRisk] = useState<'normal' | 'warning' | 'critical'>('normal');
  const [timeMul, setTimeMul] = useState(0);
  const [liveAlert, setLiveAlert] = useState<LiveAlert | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('sim_update', (data) => {
      if (!data) return;
      if (data.heatmap)     setHeatmap(data.heatmap);
      if (data.predictions) setPredictions(data.predictions);
      if (data.totalCrowd)  setTotalCrowd(data.totalCrowd);
      if (data.queues)      setQueues(data.queues);
      if (data.insights)    setInsights(data.insights);
      if (data.bestPath)    setBestPath(data.bestPath);
      if (data.risk)        setRisk(data.risk);
      if (data.timeMul !== undefined) setTimeMul(data.timeMul);
    });

    newSocket.on('live_alert', (data: LiveAlert) => {
      setLiveAlert(data);
    });

    return () => { newSocket.disconnect(); };
  }, []);

  return (
    <SocketContext.Provider value={{
      socket, isConnected, heatmap, predictions, totalCrowd,
      queues, insights, bestPath, risk, timeMul, liveAlert,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
