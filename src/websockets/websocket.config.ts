import { registerAs } from '@nestjs/config';

export const websocketConfig = registerAs('websocket', () => ({
	// WebSocket server path (defaults to /socket.io)
	path: process.env.WS_PATH || '/socket.io',

	// CORS configuration
	cors: {
		origin: process.env.WS_CORS_ORIGIN || '*',
		methods: process.env.WS_CORS_METHODS || ['GET', 'POST'],
		credentials: process.env.WS_CORS_CREDENTIALS === 'true',
	},

	// Connection settings
	pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000', 10),
	pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000', 10),
	transports: (process.env.WS_TRANSPORTS || 'websocket,polling').split(','),

	// Maximum number of connections per namespace
	maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '0', 10), // 0 means unlimited
}));
