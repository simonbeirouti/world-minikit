"use client";

import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface WebSocketHook {
	sendAudio: (audioData: string) => void;
	startAudioSession: () => void;
	lastMessage: string | null;
	isConnected: boolean;
}

interface OpenAIContent {
	content: string;
}

export const useWebSocket = (): WebSocketHook => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [lastMessage, setLastMessage] = useState<string | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const socketInstance = io(
			process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
			{
				path: "/api/socket",
				transports: ["polling", "websocket"],
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000,
				timeout: 20000,
			}
		);

		socketInstance.on("connect", () => {
			console.log("Connected to socket server", socketInstance.id);
			setIsConnected(true);
		});

		socketInstance.onAny((eventName, ...args) => {
			console.log("Received event:", eventName, args);
		});

		socketInstance.on("openai:content", (data: OpenAIContent) => {
			console.log("Received content:", data);
			setLastMessage((prev) =>
				prev ? prev + data.content : data.content
			);
		});

		socketInstance.on("openai:error", (error: { message: string }) => {
			console.error("OpenAI Error:", error);
		});

		socketInstance.on("disconnect", () => {
			console.log("Disconnected from socket server");
			setIsConnected(false);
		});

		setSocket(socketInstance);

		return () => {
			socketInstance.disconnect();
		};
	}, []);

	const sendAudio = useCallback(
		(audioData: string) => {
			if (socket?.connected) {
				console.log("Sending audio data...");
				socket.emit("audio_data", audioData);
			} else {
				console.warn("Socket not connected, cannot send audio");
			}
		},
		[socket]
	);

	const startAudioSession = useCallback(() => {
		if (socket?.connected) {
			console.log("Starting audio session...");
			socket.emit("start_audio");
		} else {
			console.warn("Socket not connected, cannot start session");
		}
	}, [socket]);

	return { sendAudio, startAudioSession, lastMessage, isConnected };
};
