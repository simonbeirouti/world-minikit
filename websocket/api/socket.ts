import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/websocket/socket';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';
import { OpenAIRealtimeSocket } from '@/websocket/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_SITE_URL || "https://brief-giving-goat.ngrok-free.app",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['polling', 'websocket'],
    });

    const openAISocket = new OpenAIRealtimeSocket(io);
    openAISocket.connect();

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('start_audio', () => {
        openAISocket.sendEvent({
          type: "response.create",
          response: {
            modalities: ["text", "audio"],
          },
        });
      });

      socket.on('audio_data', (data) => {
        openAISocket.handleUserAudio(data);
      });

      socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
} 