import {NextResponse} from "next/server";
import { prisma } from '@/lib/prisma'

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const {message} = body;

		const conversation = await prisma.conversation.create({
			data: {
				userId: 'user-id',
				title: 'New Conversation',
				messages: {
					create: {
						content: message,
						role: 'user'
					}
				}
			},
			include: {
				messages: true
			}
		})

		return NextResponse.json(conversation);
	} catch (error) {
		console.error("Chat error:", error);
		return NextResponse.json(
			{
				error: "Failed to process chat request",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{status: 500}
		);
	}
}
