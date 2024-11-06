import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(request: Request) {
	const {searchParams} = new URL(request.url);
	const worldIdHash = searchParams.get("worldIdHash");

	if (!worldIdHash) {
		return NextResponse.json({exists: false});
	}

	try {
		const user = await prisma.user.findUnique({
			where: {worldIdHash},
			select: {id: true},
		});

		return NextResponse.json({exists: !!user});
	} catch (error) {
		console.error("Error checking user existence:", error);
		return NextResponse.json(
			{error: "Failed to check user"},
			{status: 500}
		);
	}
}
