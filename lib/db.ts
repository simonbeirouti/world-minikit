import { prisma } from "./prisma";

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