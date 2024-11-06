import {prisma} from "./prisma";

export async function createOrUpdateUser(worldcoinData: {
	sub: string;
	verification_level: string;
}) {
	return await prisma.user.upsert({
		where: {
			worldIdHash: worldcoinData.sub,
		},
		update: {
			lastLogin: new Date(),
			verificationLevel: worldcoinData.verification_level,
			lastVerification: new Date(),
		},
		create: {
            id: crypto.randomUUID(),
            email: worldcoinData.sub,
			worldIdHash: worldcoinData.sub,
			verificationLevel: worldcoinData.verification_level,
			lastVerification: new Date(),
			lastLogin: new Date(),
		},
	});
}

export async function createUserSession(sessionData: {
	userId: string;
	worldIdHash: string;
	sessionToken: string;
	expiresAt: Date;
}) {
	return await prisma.userSession.create({
		data: {
			userId: sessionData.userId,
			worldIdHash: sessionData.worldIdHash,
			sessionToken: sessionData.sessionToken,
			expiresAt: sessionData.expiresAt,
		},
	});
}

// Optional: Helper to get active sessions
export async function getActiveSessions() {
	return await prisma.userSession.findMany({
		where: {
			expiresAt: {
				gt: new Date(), // Only sessions that haven't expired
			},
		},
		include: {
			user: true, // Include user details if needed
		},
	});
}