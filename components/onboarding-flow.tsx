"use client";

import {useState, useRef, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {Trash2, RefreshCw, Mic, MicOff} from "lucide-react";
import {useToast} from "@/hooks/use-toast";

interface Question {
	id: number;
	text: string;
	key: "about" | "interests" | "hobbies";
}

const questions: Question[] = [
	{id: 1, text: "Tell me about yourself", key: "about"},
	{id: 2, text: "What are your interests?", key: "interests"},
	{id: 3, text: "What are your hobbies?", key: "hobbies"},
];

type RecordingSystem = {
	start: () => Promise<void>;
	stop: () => Promise<Blob>;
	isRecording: () => boolean;
};

export function OnboardingFlow() {
	const [currentStep, setCurrentStep] = useState(0);
	const [timeLeft, setTimeLeft] = useState(10);
	const [recordings, setRecordings] = useState<Record<string, Blob>>({});
	const [transcriptions, setTranscriptions] = useState<
		Record<string, string>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const {toast} = useToast();

	const recorder = useRef<RecordingSystem | null>(null);
	const timerRef = useRef<NodeJS.Timeout>();
	const buttonPressTimer = useRef<NodeJS.Timeout>();
	const maxRecordingTime = 10000; // 10 seconds in milliseconds

	const initializeRecorder = async () => {
		try {
			console.log('Initializing recorder...');
			
			if (recorder.current?.isRecording()) {
				await recorder.current.stop();
			}
			recorder.current = null;

			if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
				throw new Error('Media devices not supported on this platform');
			}

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					channelCount: 1,
					sampleRate: 16000,
				},
			});

			let mediaRecorder: MediaRecorder | null = null;
			let audioChunks: BlobPart[] = [];
			let currentStream = stream;

			const mimeType = MediaRecorder.isTypeSupported('audio/webm')
				? 'audio/webm'
				: 'audio/mp4';

			recorder.current = {
				start: async () => {
					try {
						currentStream = await navigator.mediaDevices.getUserMedia({
							audio: {
								channelCount: 1,
								sampleRate: 16000,
							},
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
								reject(new Error('MediaRecorder not initialized'));
								return;
							}

							mediaRecorder.onstart = () => resolve();
							mediaRecorder.onerror = (event) => reject(event.error);
							mediaRecorder.start(100);
						});
					} catch (error) {
						console.error('Error in start():', error);
						throw error;
					}
				},
				stop: () => {
					return new Promise((resolve, reject) => {
						try {
							if (!mediaRecorder) {
								reject(new Error('MediaRecorder not initialized'));
								return;
							}

							mediaRecorder.onstop = () => {
								const audioBlob = new Blob(audioChunks, { type: mimeType });
								currentStream.getTracks().forEach(track => track.stop());
								resolve(audioBlob);
							};

							mediaRecorder.stop();
						} catch (error) {
							console.error('Error in stop():', error);
							reject(error);
						}
					});
				},
				isRecording: () => mediaRecorder?.state === 'recording',
			};
		} catch (error) {
			console.error('Error in initializeRecorder:', error);
			throw error;
		}
	};

	useEffect(() => {
		initializeRecorder();
		return () => {
			if (recorder.current?.isRecording()) {
				recorder.current.stop();
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
			console.error('Error in startRecording:', error);
			setIsRecording(false);
			
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
				setIsRecording(false);
				setIsTranscribing(true);

				clearInterval(timerRef.current);
				clearTimeout(buttonPressTimer.current);

				const audioBlob = await recorder.current.stop();
				
				if (audioBlob.size === 0) {
					throw new Error('Recording is empty');
				}

				setRecordings((prev) => ({
					...prev,
					[questions[currentStep].key]: audioBlob,
				}));

				const formData = new FormData();
				const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 
									audioBlob.type.includes('mp4') ? 'mp4' : 
									audioBlob.type.includes('ogg') ? 'ogg' : 'mp3';

				formData.append(
					"audio",
					audioBlob,
					`${questions[currentStep].key}.${fileExtension}`
				);
				formData.append("questionKey", questions[currentStep].key);

				console.log('Sending for transcription...');
				const response = await fetch("/api/transcribe", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Failed to transcribe audio');
				}

				const data = await response.json();
				if (data.text) {
					setTranscriptions((prev) => ({
						...prev,
						[questions[currentStep].key]: data.text,
					}));
				}
			} catch (error) {
				console.error('Error in stopRecording:', error);
				
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
				const newRecordings = {...prev};
				delete newRecordings[key];
				return newRecordings;
			});
			
			setTranscriptions((prev) => {
				const newTranscriptions = {...prev};
				delete newTranscriptions[key];
				return newTranscriptions;
			});

			await initializeRecorder();
		} catch (error) {
			console.error('Error in deleteRecording:', error);
			toast({
				title: "Failed to reset recording",
				description: "Please refresh the page and try again.",
				variant: "destructive",
			});
		}
	};

	const handleNext = () => {
		if (currentStep < questions.length - 1) {
			setCurrentStep((prev) => prev + 1);
		} else {
			toast({
				title: "All responses submitted successfully!",
				description: "Thank you for completing the onboarding.",
			});
		}
	};

	const allResponsesComplete =
		Object.keys(transcriptions).length === questions.length;

	// Simplify the button handlers
	const handlePointerDown = async (e: React.PointerEvent) => {
		e.preventDefault();
		await startRecording();
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		e.preventDefault();
		stopRecording();
	};

	const handlePointerLeave = (e: React.PointerEvent) => {
		e.preventDefault();
		stopRecording();
	};

	return (
		<div className="w-full max-w-3xl mx-auto space-y-8">
			<div className="p-6 space-y-6">
				<Progress
					value={((currentStep + 1) / questions.length) * 100}
				/>

				{/* Summary of all responses */}
				<div className="p-6">
					<h3 className="text-lg font-semibold mb-4">
						Your Responses
					</h3>
					<div className="space-y-4">
						{questions.map((question) => (
							<div key={question.id} className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">
									{question.text}
								</p>
								{transcriptions[question.key] ? (
									<div className="p-3 bg-muted rounded-md">
										<p className="text-sm">
											{transcriptions[question.key]}
										</p>
									</div>
								) : (
									<p className="text-sm text-muted-foreground italic">
										{currentStep >= question.id
											? "Recording pending..."
											: "Not recorded yet"}
									</p>
								)}
							</div>
						))}
					</div>

					{allResponsesComplete && (
						<div className="mt-6 p-4 bg-muted rounded-md">
							<p className="text-sm font-medium text-green-600">
								✓ All responses completed!
							</p>
						</div>
					)}
				</div>

				<div className="space-y-4">
					<h2 className="text-2xl font-bold">
						{questions[currentStep].text}
					</h2>

					<div className="space-y-4">
						{recordings[questions[currentStep].key] && (
							<div className="space-y-3 rounded-lg bg-muted p-4">
								{isTranscribing ? (
									<div className="p-4 bg-background rounded-md border">
										<div className="flex items-center gap-2">
											<RefreshCw className="h-4 w-4 animate-spin" />
											<p className="text-sm text-muted-foreground">
												Transcribing...
											</p>
										</div>
									</div>
								) : transcriptions[
										questions[currentStep].key
								  ] ? (
									<div className="p-4 bg-background rounded-md border">
										<p className="text-sm font-medium text-muted-foreground mb-2">
											Transcription:
										</p>
										<p className="text-sm leading-relaxed">
											{
												transcriptions[
													questions[currentStep].key
												]
											}
										</p>
									</div>
								) : null}

								<div className="flex items-center gap-2">
									<audio
										src={URL.createObjectURL(
											recordings[
												questions[currentStep].key
											]
										)}
										controls
										className="flex-1"
									/>
									<Button
										variant="outline"
										size="icon"
										onClick={() => startRecording()}
										disabled={isSubmitting}
										title="Re-record"
									>
										<RefreshCw className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										onClick={() =>
											deleteRecording(
												questions[currentStep].key
											)
										}
										disabled={isSubmitting}
										title="Delete recording"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}

						<div className="flex justify-center">
							<Button
								onPointerDown={handlePointerDown}
								onPointerUp={handlePointerUp}
								onPointerLeave={handlePointerLeave}
								variant={
									isRecording ? "destructive" : "default"
								}
								size="icon"
								className="h-16 w-16 rounded-full touch-none select-none"
								disabled={isSubmitting || isTranscribing}
							>
								{isRecording ? (
									<>
										<MicOff className="h-8 w-8" />
										<span className="sr-only">
											Release to stop ({timeLeft}s)
										</span>
									</>
								) : (
									<>
										<Mic className="h-8 w-8" />
										<span className="sr-only">
											Press and hold to record
										</span>
									</>
								)}
							</Button>
						</div>
						{isRecording && (
							<p className="text-center text-sm text-muted-foreground">
								Recording... {timeLeft}s remaining
							</p>
						)}
					</div>

					<div className="flex justify-between gap-4 mt-6">
						<Button
							variant="outline"
							onClick={() =>
								setCurrentStep((prev) => Math.max(0, prev - 1))
							}
							disabled={currentStep === 0 || isSubmitting}
							className="w-full"
						>
							Previous
						</Button>
						<Button
							onClick={handleNext}
							disabled={
								!recordings[questions[currentStep].key] ||
								isTranscribing
							}
							className="w-full"
						>
							{currentStep === questions.length - 1
								? "Finish"
								: "Next"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
