import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import MiniKitProvider from "@/components/minikit-provider";
import dynamic from "next/dynamic";
import NextAuthProvider from "@/components/next-auth-provider";
import { Gate } from "@/components/gate";
import {Toaster} from "@/components/ui/toaster";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
	title: "Create Next App",
	description: "Generated by create next app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const ErudaProvider = dynamic(
		() => import("../components/eruda").then((c) => c.ErudaProvider),
		{
			ssr: false,
		}
	);
	return (
		<html lang="en">
			<body className={`${inter.className} h-screen w-screen`}>
				<NextAuthProvider>
					<ErudaProvider>
						<MiniKitProvider>
							<Gate>
								{children}
							</Gate>
						</MiniKitProvider>
					</ErudaProvider>
				</NextAuthProvider>
				<Toaster />
			</body>
		</html>
	);
}
