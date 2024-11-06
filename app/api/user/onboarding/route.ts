import {NextResponse} from "next/server";
import {getUserOnboardingStatus, updateUserProfile} from "@/lib/db";

export async function GET(request: Request) {
	const {searchParams} = new URL(request.url);
	const userName = searchParams.get("userName");

	if (!userName) {
		return NextResponse.json({error: "User ID is required"}, {status: 400});
	}

	try {
		const profile = await getUserOnboardingStatus(userName);
		return NextResponse.json(profile);
	} catch (error) {
		console.error("Error fetching user onboarding status:", error);
		return NextResponse.json(
			{error: "Failed to fetch onboarding status"},
			{status: 500}
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {userId, profileData} = body;

		if (!userId) {
			return NextResponse.json({error: "User ID is required"}, {status: 400});
		}

		const updatedProfile = await updateUserProfile(userId, {
			...profileData,
			onboardingStatus: "COMPLETED"
		});

		return NextResponse.json(updatedProfile);
	} catch (error) {
		console.error("Error updating user profile:", error);
		return NextResponse.json(
			{error: "Failed to update profile"},
			{status: 500}
		);
	}
}
