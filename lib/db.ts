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
			worldIdHash: worldcoinData.sub,
			verificationLevel: worldcoinData.verification_level,
			lastVerification: new Date(),
			lastLogin: new Date(),
		},
	});
}

export async function getUserOnboardingStatus(userName: string) {
	try {
		const userProfile = await prisma.user.findFirst({
			where: {
				worldIdHash: userName,
			},
			select: {
				id: true,
				profile: true,
			},
		});

		return userProfile;
	} catch (error) {
		console.error("Error in getUserOnboardingStatus:", error);
		throw error;
	}
}
