// @ts-nocheck
"use client";

import {useSession} from "next-auth/react";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {useOnboardingStatus} from "@/hooks/use-onboarding-status";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {useRouter} from "next/navigation";
import {useToast} from "@/hooks/use-toast";
import {cn} from "@/lib/utils";

const ONBOARDING_FIELDS = [
	{
		id: "name",
		label: "Name",
		type: "input",
		placeholder: "Your name",
	},
	{
		id: "email",
		label: "Email",
		type: "input",
		placeholder: "Your email",
	},
	{
		id: "language",
		label: "Preferred Language",
		type: "select",
		options: [
			{value: "en", label: "English"},
			{value: "es", label: "Spanish"},
			{value: "fr", label: "French"},
			{value: "de", label: "German"},
			{value: "it", label: "Italian"},
		],
	},
	{
		id: "timezone",
		label: "Timezone",
		type: "select",
		options: [
			{value: "UTC", label: "UTC"},
			{value: "America/New_York", label: "EST"},
			{value: "America/Los_Angeles", label: "PST"},
			{value: "Europe/London", label: "GMT"},
			{value: "Asia/Tokyo", label: "JST"},
		],
	},
	{
		id: "topics",
		label: "Interests",
		type: "toggle-group",
		options: [
			{ value: "technology", label: "Technology" },
			{ value: "science", label: "Science" },
			{ value: "arts", label: "Arts" },
			{ value: "business", label: "Business" }
		]
	},
	{
		id: "preferences",
		label: "Preferences",
		type: "toggle-group",
		options: [
			{ value: "darkMode", label: "Dark Mode" },
			{ value: "notifications", label: "Notifications" },
			{ value: "newsletter", label: "Newsletter" }
		]
	},
];

type ToggleButtonGroupProps = {
	field: typeof ONBOARDING_FIELDS[0],
	values: string[],
	onChange: (values: string[]) => void
};

function ToggleButtonGroup({ field, values, onChange }: ToggleButtonGroupProps) {
	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-2">
				{field.options.map((option) => {
					const isSelected = values.includes(option.value);
					return (
						<button
							key={option.value}
							onClick={() => {
								const newValues = isSelected
									? values.filter(v => v !== option.value)
									: [...values, option.value];
								onChange(newValues);
							}}
							className={cn(
								"px-3 py-1.5 text-sm rounded-md border transition-colors",
								isSelected 
									? "bg-primary text-primary-foreground border-primary" 
									: "bg-background hover:bg-accent border-input"
							)}
							type="button"
						>
							{option.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export function RouterScreen() {
	const {data: session} = useSession();
	const {loading, profile} = useOnboardingStatus();
	const [setupProgress, setSetupProgress] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();
	const {toast} = useToast();

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		language: "en",
		timezone: "UTC",
		topics: [] as string[],
		preferences: [] as string[],
	});

	const validateForm = () => {
		if (!formData.name?.trim()) {
			toast({
				title: "Error",
				description: "Name is required",
				variant: "destructive",
			});
			return false;
		}
		if (!formData.email?.trim()) {
			toast({
				title: "Error",
				description: "Email is required",
				variant: "destructive",
			});
			return false;
		}
		// Add email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			toast({
				title: "Error",
				description: "Please enter a valid email address",
				variant: "destructive",
			});
			return false;
		}
		return true;
	};

    const handleSubmit = async () => {
        if (!validateForm()) return;
		if (!session?.user?.id) {
			toast({
				title: "Error",
				description: "User not authenticated",
				variant: "destructive",
			});
			return;
		}

		try {
			const response = await fetch("/api/user/onboarding", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: session.user.id,
					profileData: {
						...formData,
						topics: JSON.stringify(formData.topics),
						preferences: JSON.stringify(formData.preferences),
					},
				}),
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			toast({
				title: "Success",
				description: "Profile saved successfully",
			});

			router.refresh();
		} catch (error) {
			console.error("Error saving profile:", error);
			toast({
				title: "Error",
				description: "Failed to save profile",
				variant: "destructive",
			});
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen space-y-4">
				<Progress value={setupProgress} className="w-[60%] max-w-md" />
				<p className="text-muted-foreground">
					Checking your profile...
				</p>
			</div>
		);
	}

	if (
		!profile?.profile?.onboardingStatus ||
		profile?.profile?.onboardingStatus === "NOT_STARTED"
	) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-4">
				<h1 className="text-4xl font-bold text-center">Your Profile</h1>
				<div className="w-full max-w-md space-y-6">
					{ONBOARDING_FIELDS.map((field) => (
						<div key={field.id} className="space-y-2">
							<Label htmlFor={field.id}>{field.label}</Label>
							{field.type === "toggle-group" ? (
								<ToggleButtonGroup
									field={field}
									values={formData[field.id]}
									onChange={(values) => setFormData({ ...formData, [field.id]: values })}
								/>
							) : field.type === "input" ? (
								<Input
									id={field.id}
									placeholder={field.placeholder}
									value={formData[field.id]}
									onChange={(e) =>
										setFormData({
											...formData,
											[field.id]: e.target.value,
										})
									}
								/>
							) : field.type === "select" ? (
								<Select
									value={
										field.multiple
											? formData[field.id][0]
											: formData[field.id]
									}
									onValueChange={(value) => {
										if (field.multiple) {
											const currentValues = formData[
												field.id
											] as string[];
											const newValues =
												currentValues.includes(value)
													? currentValues.filter(
															(v) => v !== value
													  )
													: [...currentValues, value];
											setFormData({
												...formData,
												[field.id]: newValues,
											});
										} else {
											setFormData({
												...formData,
												[field.id]: value,
											});
										}
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={`Select ${field.label.toLowerCase()}`}
										>
											{field.multiple
												? `${
														formData[field.id]
															.length
												  } selected`
												: field.options.find(
														(opt) =>
															opt.value ===
															formData[field.id]
												  )?.label}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{field.options.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}
												className={
													field.multiple &&
													formData[field.id].includes(
														option.value
													)
														? "bg-accent"
														: ""
												}
											>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : null}
						</div>
					))}

					<Button
						size="lg"
						className="w-full"
						onClick={handleSubmit}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Saving..." : "Save Profile"}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-4">
			<h1 className="text-4xl font-bold text-center">Welcome Back!</h1>
			<p className="text-muted-foreground text-center max-w-md">
				Ready to continue our conversation?
			</p>
			<div className="flex gap-4">
				<Button variant="outline">View History</Button>
				<Button>Start New Chat</Button>
			</div>
		</div>
	);
}
