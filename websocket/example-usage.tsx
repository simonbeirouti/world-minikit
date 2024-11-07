"use client";

import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export function ExampleComponent() {
	const { sendAudio, startAudioSession, lastMessage, isConnected } =
		useWebSocket();
	const [isRecording, setIsRecording] = useState(false);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const [error, setError] = useState<string | null>(null);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			mediaRecorder.current = new MediaRecorder(stream, {
				mimeType: "audio/webm;codecs=opus",
			});

			mediaRecorder.current.ondataavailable = async (event) => {
				if (event.data.size > 0) {
					const audioBuffer = await event.data.arrayBuffer();
					const pcm16Data = convertToPCM16(audioBuffer);
					const base64Data = btoa(
						String.fromCharCode(...Array.from(new Uint8Array(pcm16Data)))
					);
					sendAudio(base64Data);
				}
			};

			startAudioSession();
			mediaRecorder.current.start(100);
			setIsRecording(true);
			setError(null);
		} catch (error) {
			console.error("Error accessing microphone:", error);
			setError(
				"Error accessing microphone. Please ensure you have granted permission."
			);
		}
	};

	const stopRecording = () => {
		if (mediaRecorder.current && isRecording) {
			mediaRecorder.current.stop();
			mediaRecorder.current.stream
				.getTracks()
				.forEach((track) => track.stop());
			setIsRecording(false);
		}
	};

	useEffect(() => {
		return () => {
			if (mediaRecorder.current && isRecording) {
				mediaRecorder.current.stop();
				mediaRecorder.current.stream
					.getTracks()
					.forEach((track) => track.stop());
			}
		};
	}, [isRecording]);

	const convertToPCM16 = (audioBuffer: ArrayBuffer) => {
		const float32Array = new Float32Array(audioBuffer.byteLength / 4);
		const pcm16Array = new Int16Array(float32Array.length);

		for (let i = 0; i < float32Array.length; i++) {
			pcm16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 0x7fff;
		}

		return pcm16Array.buffer;
	};

	return (
		<div className="p-4">
			<div className="mb-4">
				<div className="flex items-center gap-2">
					<div
						className={`w-2 h-2 rounded-full ${
							isConnected ? "bg-green-500" : "bg-red-500"
						}`}
					/>
					<span>{isConnected ? "Connected" : "Disconnected"}</span>
				</div>
			</div>

			{error && (
				<div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
					{error}
				</div>
			)}

			<Button
				onClick={isRecording ? stopRecording : startRecording}
				disabled={!isConnected}
				className={`mb-4 ${
					isRecording ? "bg-red-500 hover:bg-red-600" : ""
				}`}
			>
				{isRecording ? "Stop Recording" : "Start Recording"}
			</Button>

			<div className="border rounded-lg p-4 min-h-[100px] bg-slate-50">
				{lastMessage ? (
					<p className="whitespace-pre-wrap">{lastMessage}</p>
				) : (
					<p className="text-gray-400">
						Messages will appear here...
					</p>
				)}
			</div>
		</div>
	);
}
