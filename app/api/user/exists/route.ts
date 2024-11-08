import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const session = await getServerSession();
	
	if (!session?.user?.name) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// First find user by worldIdHash
		const user = await prisma.user.findUnique({
			where: {
				worldIdHash: session.user.name
			},
			include: {
				profile: true
			}
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ profile: user.profile });
	} catch (error) {
		console.error("Error fetching profile:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
