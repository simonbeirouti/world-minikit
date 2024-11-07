import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import WebSocket from 'ws';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

interface OpenAIWebSocket extends WebSocket {
  isAlive?: boolean;
}

export class OpenAIRealtimeSocket {
  private ws: OpenAIWebSocket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(private io: SocketIOServer) {}

  connect() {
    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
    
    console.log("Connecting to OpenAI Realtime API...");
    
    this.ws = new WebSocket(url, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }) as OpenAIWebSocket;

    this.ws.on("open", this.handleOpen.bind(this));
    this.ws.on("message", this.handleMessage.bind(this));
    this.ws.on("error", this.handleError.bind(this));
    this.ws.on("close", this.handleClose.bind(this));
    this.ws.on("pong", () => {
      if (this.ws) this.ws.isAlive = true;
    });

    this.pingInterval = setInterval(() => {
      if (this.ws?.isAlive === false) {
        console.log("Connection dead, terminating...");
        this.ws.terminate();
        return;
      }
      this.ws!.isAlive = false;
      this.ws!.ping();
    }, 30000);
  }

  private handleOpen() {
    console.log("Connected to OpenAI Realtime API");
    this.initializeSession();
  }

  private handleMessage(data: WebSocket.RawData) {
    try {
      const event = JSON.parse(data.toString());
      console.log("Received OpenAI event:", event);

      switch (event.type) {
        case "session.created":
          console.log("Session created:", event);
          this.io.emit("openai:session_created", event);
          break;
        case "response.content_part.added":
          console.log("Content received:", event.content);
          this.io.emit("openai:content", { content: event.content });
          break;
        case "error":
          console.error("OpenAI Error:", event.error);
          this.io.emit("openai:error", event.error);
          break;
        default:
          this.io.emit(`openai:${event.type}`, event);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }

  private handleError(error: Error) {
    console.error("WebSocket error:", error);
    this.io.emit("openai:error", { message: error.message });
  }

  private handleClose() {
    console.log("Disconnected from OpenAI Realtime API");
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    setTimeout(() => this.connect(), 5000);
  }

  private initializeSession() {
    const initEvent = {
      type: "session.update",
      session: {
        input_audio_transcription: true,
        voice: "alloy",
        instructions: "You are a helpful AI assistant. Keep your responses concise and engaging.",
      },
    };
    this.sendEvent(initEvent);
  }

  public sendEvent(event: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("Sending event to OpenAI:", event);
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn("WebSocket is not open");
    }
  }

  public handleUserAudio(audioData: string) {
    const audioEvent = {
      type: "input_audio_buffer.append",
      audio: audioData,
    };
    this.sendEvent(audioEvent);
  }
}