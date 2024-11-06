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

const ONBOARDING_FIELDS = [
	{
		id: 'name',
		label: 'Name',
		type: 'input',
		placeholder: 'Your name'
	},
	{
		id: 'email',
		label: 'Email',
		type: 'input',
		placeholder: 'Your email'
	},
	{
		id: 'language',
		label: 'Preferred Language',
		type: 'select',
		options: [
			{ value: 'en', label: 'English' },
			{ value: 'es', label: 'Spanish' },
			{ value: 'fr', label: 'French' },
			{ value: 'de', label: 'German' },
			{ value: 'it', label: 'Italian' }
		]
	},
	{
		id: 'timezone',
		label: 'Timezone',
		type: 'select',
		options: [
			{ value: 'UTC', label: 'UTC' },
			{ value: 'America/New_York', label: 'EST' },
			{ value: 'America/Los_Angeles', label: 'PST' },
			{ value: 'Europe/London', label: 'GMT' },
			{ value: 'Asia/Tokyo', label: 'JST' }
		]
	},
	{
		id: 'topics',
		label: 'Interests',
		type: 'select',
		multiple: true,
		options: [
			{ value: 'technology', label: 'Technology' },
			{ value: 'science', label: 'Science' },
			{ value: 'arts', label: 'Arts' },
			{ value: 'business', label: 'Business' }
		]
	},
	{
		id: 'preferences',
		label: 'Preferences',
		type: 'select',
		multiple: true,
		options: [
			{ value: 'darkMode', label: 'Dark Mode' },
			{ value: 'notifications', label: 'Notifications' },
			{ value: 'newsletter', label: 'Newsletter' }
		]
	}
];

export function RouterScreen() {
	const {data: session} = useSession();
	const {loading, profile} = useOnboardingStatus();
	const [setupProgress, setSetupProgress] = useState(0);
	
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		language: "en",
		timezone: "UTC",
		topics: [] as string[],
		preferences: [] as string[]
	});

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

	if (!profile?.profile?.onboardingStatus || profile?.profile?.onboardingStatus === "NOT_STARTED") {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-4">
				<h1 className="text-4xl font-bold text-center">
					Your Profile
				</h1>
				<div className="w-full max-w-md space-y-6">
					{ONBOARDING_FIELDS.map((field) => (
						<div key={field.id} className="space-y-2">
							<Label htmlFor={field.id}>{field.label}</Label>
							{field.type === 'input' ? (
								<Input
									id={field.id}
									placeholder={field.placeholder}
									value={formData[field.id]}
									onChange={(e) =>
										setFormData({...formData, [field.id]: e.target.value})
									}
								/>
							) : (
								<Select
									value={formData[field.id]}
									onValueChange={(value) =>
										setFormData({...formData, [field.id]: field.multiple ? [...formData[field.id], value] : value})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
									</SelectTrigger>
									<SelectContent>
										{field.options.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					))}

					<Button
						size="lg"
						className="w-full"
						onClick={() => {
							// TODO: Implement save functionality
							console.log("Save profile:", formData);
						}}
					>
						Save Profile
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
