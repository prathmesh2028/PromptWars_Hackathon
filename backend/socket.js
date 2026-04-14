const { generateSimulationData } = require('./services/simulationService');

let io;

const initSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send an immediate snapshot so new clients don't wait 3 seconds
    const snapshot = generateSimulationData();
    socket.emit('sim_update', snapshot);

    // Listen for admin alert pushes
    socket.on('push_alert', (data) => {
      console.log('Admin alert broadcasted:', data);
      io.emit('live_alert', { message: data, timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Simulation loop — tick every 3 seconds
  setInterval(() => {
    const simData = generateSimulationData();
    io.emit('sim_update', simData);
  }, 3000);
};

module.exports = { initSocket };
