import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { RecordingSystem, Question } from "@/types/recording";

interface UseRecorderProps {
	currentStep: number;
	questions: Question[];
	setRecordings: (cb: (prev: Record<string, Blob>) => Record<string, Blob>) => void;
	setTranscriptions: (cb: (prev: Record<string, string>) => Record<string, string>) => void;
}

export function useRecorder({ 
	currentStep, 
	questions, 
	setRecordings, 
	setTranscriptions 
}: UseRecorderProps) {
	const [timeLeft, setTimeLeft] = useState(10);
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const recorder = useRef<RecordingSystem | null>(null);
	const timerRef = useRef<NodeJS.Timeout>();
	const buttonPressTimer = useRef<NodeJS.Timeout>();
	const { toast } = useToast();
	const maxRecordingTime = 10000;
	const minRecordingTime = 500;
	const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

	const initializeRecorder = async () => {
		try {
			if (recorder.current?.isRecording()) {
				await recorder.current.stop();
			}
			recorder.current = null;

			if (typeof navigator === "undefined" || !navigator.mediaDevices) {
				throw new Error("Media devices not supported");
			}

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: { channelCount: 1, sampleRate: 16000 },
			});

			let mediaRecorder: MediaRecorder | null = null;
			let audioChunks: BlobPart[] = [];
			let currentStream = stream;

			const mimeType = MediaRecorder.isTypeSupported("audio/webm")
				? "audio/webm"
				: "audio/mp4";

			recorder.current = {
				start: async () => {
					try {
						currentStream = await navigator.mediaDevices.getUserMedia({
							audio: { channelCount: 1, sampleRate: 16000 },
						});

						audioChunks = [];
						mediaRecorder = new MediaRecorder(currentStream, {
							mimeType,
							audioBitsPerSecond: 128000,
						});

						mediaRecorder.ondataavailable = (event) => {
							if (event.data.size > 0) {
								audioChunks.push(event.data);
							}
						};

						return new Promise<void>((resolve, reject) => {
							if (!mediaRecorder) {
								reject(new Error("MediaRecorder not initialized"));
								return;
							}

							mediaRecorder.onstart = () => resolve();
							mediaRecorder.onerror = () => reject(new Error("MediaRecorder error"));
							mediaRecorder.start(100);
						});
					} catch (error) {
						console.error("Error in start():", error);
						throw error;
					}
				},
				stop: () => {
					return new Promise<Blob>((resolve, reject) => {
						try {
							if (!mediaRecorder) {
								reject(new Error("MediaRecorder not initialized"));
								return;
							}

							mediaRecorder.onstop = () => {
								const audioBlob = new Blob(audioChunks, { type: mimeType });
								currentStream.getTracks().forEach((track) => track.stop());
								resolve(audioBlob);
							};

							mediaRecorder.stop();
						} catch (error) {
							console.error("Error in stop():", error);
							reject(error);
						}
					});
				},
				isRecording: () => mediaRecorder?.state === "recording",
			};
		} catch (error) {
			console.error("Error in initializeRecorder:", error);
			throw error;
		}
	};

	useEffect(() => {
		initializeRecorder();
		return () => {
			if (recorder.current?.isRecording()) {
				void recorder.current.stop();
			}
			clearInterval(timerRef.current);
			clearTimeout(buttonPressTimer.current);
		};
	}, []);

	const startRecording = async () => {
		try {
			if (!recorder.current) {
				await initializeRecorder();
			}

			await recorder.current?.start();
			setIsRecording(true);
			setTimeLeft(10);
			setRecordingStartTime(Date.now());

			buttonPressTimer.current = setTimeout(() => {
				void stopRecording();
			}, maxRecordingTime);

			timerRef.current = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						void stopRecording();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} catch (error) {
			console.error("Error in startRecording:", error);
			setIsRecording(false);
			setRecordingStartTime(null);
			await initializeRecorder();
			toast({
				title: "Recording failed",
				description: "Please try again.",
				variant: "destructive",
			});
		}
	};

	const stopRecording = async () => {
		if (recorder.current?.isRecording()) {
			try {
				const elapsedTime = recordingStartTime ? Date.now() - recordingStartTime : 0;
				if (elapsedTime < minRecordingTime) {
					toast({
						title: "Recording too short",
						description: "Please hold the button longer to record.",
						variant: "destructive",
					});
					
					await recorder.current.stop();
					setIsRecording(false);
					setRecordingStartTime(null);
					clearInterval(timerRef.current);
					clearTimeout(buttonPressTimer.current);
					await initializeRecorder();
					return;
				}

				setIsRecording(false);
				setIsTranscribing(true);
				setRecordingStartTime(null);

				clearInterval(timerRef.current);
				clearTimeout(buttonPressTimer.current);

				const audioBlob = await recorder.current.stop();

				if (audioBlob.size === 0) {
					throw new Error("Recording is empty");
				}

				setRecordings((prev) => ({
					...prev,
					[questions[currentStep].key]: audioBlob,
				}));

				const formData = new FormData();
				const fileExtension = audioBlob.type.includes("webm")
					? "webm"
					: audioBlob.type.includes("mp4")
					? "mp4"
					: audioBlob.type.includes("ogg")
					? "ogg"
					: "mp3";

				formData.append(
					"audio",
					audioBlob,
					`${questions[currentStep].key}.${fileExtension}`
				);
				formData.append("questionKey", questions[currentStep].key);

				const response = await fetch("/api/transcribe", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to transcribe audio");
				}

				const data = await response.json();
				if (data.text) {
					setTranscriptions((prev) => ({
						...prev,
						[questions[currentStep].key]: data.text,
					}));
				}
			} catch (error) {
				console.error("Error in stopRecording:", error);
				await initializeRecorder();
				toast({
					title: "Failed to process recording",
					description: "Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsTranscribing(false);
			}
		}
	};

	const deleteRecording = async (key: string) => {
		try {
			if (recorder.current?.isRecording()) {
				await recorder.current.stop();
			}

			setRecordings((prev) => {
				const newRecordings = { ...prev };
				delete newRecordings[key];
				return newRecordings;
			});

			setTranscriptions((prev) => {
				const newTranscriptions = { ...prev };
				delete newTranscriptions[key];
				return newTranscriptions;
			});

			await initializeRecorder();
		} catch (error) {
			console.error("Error in deleteRecording:", error);
			toast({
				title: "Failed to reset recording",
				description: "Please refresh the page and try again.",
				variant: "destructive",
			});
		}
	};

	return {
		timeLeft,
		isRecording,
		isTranscribing,
		startRecording,
		stopRecording,
		deleteRecording,
	};
}
