"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {Trash2, RefreshCw, Mic, MicOff} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {useRecorder} from "@/hooks/use-recorder";
// import {ResponsesSummary} from "@/components/responses-summary";
import {questions} from "@/types/recording";

export function OnboardingFlow() {
	const [currentStep, setCurrentStep] = useState(0);
	const [recordings, setRecordings] = useState<Record<string, Blob>>({});
	const [transcriptions, setTranscriptions] = useState<
		Record<string, string>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const {toast} = useToast();

	const {
		timeLeft,
		isRecording,
		isTranscribing,
		startRecording,
		stopRecording,
		deleteRecording,
	} = useRecorder({
		currentStep,
		questions,
		setRecordings,
		setTranscriptions,
	});

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

	// const allResponsesComplete =
	// 	Object.keys(transcriptions).length === questions.length;

	const handlePointerDown = async (e: React.PointerEvent) => {
		e.preventDefault();
		await startRecording();
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		e.preventDefault();
		void stopRecording();
	};

	const handlePointerLeave = (e: React.PointerEvent) => {
		e.preventDefault();
		void stopRecording();
	};

	return (
		<div className="w-full h-[calc(100vh-2rem)] max-w-3xl mx-auto space-y-8">
			<div className="h-full p-6 space-y-6 flex flex-col">
				<Progress
					value={((currentStep + 1) / questions.length) * 100}
				/>

				{/* <ResponsesSummary
					questions={questions}
					transcriptions={transcriptions}
					currentStep={currentStep}
					allResponsesComplete={allResponsesComplete}
				/> */}

				<div className="flex-1 flex flex-col space-y-4">
					<h2 className="text-2xl font-bold text-center py-12">
						{questions[currentStep].text}
					</h2>

					<div className="flex-1 flex flex-col space-y-4">
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
								) : (
									transcriptions[
										questions[currentStep].key
									] && (
										<div className="p-4 bg-background rounded-md border">
											<p className="text-sm font-medium text-muted-foreground mb-2">
												Transcription:
											</p>
											<p className="text-sm leading-relaxed">
												{
													transcriptions[
														questions[currentStep]
															.key
													]
												}
											</p>
										</div>
									)
								)}

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
					</div>

					<div className="flex-1 flex flex-col justify-center items-center gap-4">
						<Button
							onPointerDown={handlePointerDown}
							onPointerUp={handlePointerUp}
							onPointerLeave={handlePointerLeave}
							variant={isRecording ? "destructive" : "default"}
							size="icon"
							className="h-24 w-24 rounded-full touch-none select-none"
							disabled={isSubmitting || isTranscribing}
						>
							{isRecording ? (
								<>
									<MicOff className="h-12 w-12" />
									<span className="sr-only">
										Release to stop ({timeLeft}s)
									</span>
								</>
							) : (
								<>
									<Mic className="h-12 w-12" />
									<span className="sr-only">
										Press and hold to record
									</span>
								</>
							)}
						</Button>
					</div>

					<div className="flex justify-between gap-4">
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
