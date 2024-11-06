import {useSession} from "next-auth/react";
import {useState, useEffect} from "react";

interface UserProfile {
	onboardingStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
	name?: string;
	language: string;
	timezone: string;
	topics: string[];
}

export function useOnboardingStatus() {
	const {data: session} = useSession();
	const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);

	useEffect(() => {
		async function checkStatus() {
			if (!session?.user?.name) return;

			try {
				const response = await fetch(
					`/api/user/onboarding?userName=${session?.user?.name}`
				);
				const data = await response.json();
				setProfile(data);
			} catch (error) {
				console.error("Error fetching onboarding status:", error);
			} finally {
				setLoading(false);
			}
		}

		checkStatus();
	}, [session]);

	return {loading, profile};
}
