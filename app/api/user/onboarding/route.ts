import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {prisma} from "@/lib/prisma";
import { generateQuestions } from "@/lib/groq";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.name) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const data = await req.json();
		const { interests, ...otherData } = data;

		// Update user profile
		await prisma.user.update({
			where: { id: session.user.name },
			data: {
				...otherData,
				interests,
				onboardingComplete: true,
			},
		});

		// Generate and store questions
		// const generatedQuestions = await generateQuestions(interests);
		
		// await prisma.question.createMany({
		// 	data: generatedQuestions.map(question => ({
		// 		userId: session.user?.name!,
		// 		question,
		// 	})),
		// });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Onboarding error:", error);
		return NextResponse.json(
			{ error: "Failed to complete onboarding" },
			{ status: 500 }
		);
	}
}
