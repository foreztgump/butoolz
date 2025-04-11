"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Coffee,
  Copy,
  Heart,
  Bitcoin,
  Coins,
  ExternalLink,
  Check,
} from "lucide-react";

export default function DonatePage() {
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  // Replace these with your actual crypto wallet addresses if needed
  const cryptoWallets = [
    {
      name: "Bitcoin (BTC)",
      address: "bc1qhgtdds3ajhagtxxx00gafcytmm34xw92n00yul", // Replace with your actual BTC address
      icon: <Bitcoin className="h-4 w-4" />,
    },
    {
      name: "Ethereum (ETH)",
      address: "0x6D5Fa10A0b140f4e2786aBa433F7C3E28922E598", // Replace with your actual ETH address
      icon: <Coins className="h-4 w-4" />,
    },
    {
      name: "Monero (XMR)",
      address: "43qbvMcbHn34oK3SAqAR4Q8ehLPmtAFrwC1J1mFC4bcp115on4U4yQoSzU59B5Q21NUQfGmRUWFPjD6Q1XDMdYhqHLDEuFw", // Replace with your actual ETH address
      icon: <Coins className="h-4 w-4" />,
    },
    // Add other crypto wallets here if you have them
  ];

  const copyToClipboard = (text: string, name: string) => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not supported", {
        description: "Your browser does not support clipboard access.",
      });
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedWallet(name);
        toast.success("Copied to clipboard", {
          description: `${name} wallet address has been copied.`,
        });

        // Reset the copied state after 3 seconds
        setTimeout(() => {
          setCopiedWallet(null);
        }, 3000);
      },
      (err) => {
        console.error("Failed to copy: ", err);
        toast.error("Failed to copy", {
          description: "Could not copy the wallet address. Please try again.",
        });
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        {" "}
        {/* Increased gap */}
        <div className="">
          {" "}
          {/* Removed text-center */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Support BuTools
          </h1>{" "}
          {/* Larger title */}
          <p className="mt-2 text-base text-muted-foreground">
            {" "}
            {/* Larger description -> Changed to text-base */}
            If you find these tools helpful, consider supporting the development and maintenance of BuTools.
          </p>
        </div>
        <Card className="border bg-zinc-800/25 shadow-sm">
          {" "}
          {/* Updated className */}
          <CardHeader className="pb-4">
            {" "}
            {/* Adjusted padding */}
            <CardTitle className="text-xl flex items-center gap-2">
              {" "}
              {/* Larger title */}
              <Heart className="h-5 w-5 text-rose-500" />
              Why Donate?
            </CardTitle>
            <CardDescription>
              Let's be real here. Running this site costs actual money:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {" "}
            {/* Consistent text size */}
            <ul className="list-disc list-inside mb-4 space-y-1">
              <li>Server costs (those electrons don't feed themselves)</li>
              <li>
                Domain name (yes, I have to pay yearly just to use "butools")
              </li>
              <li>Coffee Beer (coding fuel isn't free)</li>
              <li>My sanity (priceless, but donations help)</li>
            </ul>
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 text-sm">
              {" "}
              {/* Lighter border */}
              <p className="font-medium">
                I'm not getting rich here, just trying not to go broke helping
                fellow gamers.
              </p>
              <p className="text-muted-foreground mt-1">
                Every donation helps keep this site running so you can keep
                optimizing those gear scores!
              </p>
            </div>
          </CardContent>
        </Card>
        <Tabs defaultValue="buymeacoffee" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            {" "}
            {/* Full width, increased margin */}
            <TabsTrigger
              value="buymeacoffee"
              className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer"
            >
              {" "}
              {/* Applied styles from shapedoctor */}
              <Coffee className="h-4 w-4" />
              Buy Me a <span className="line-through">Coffee</span> Beer
            </TabsTrigger>
            <TabsTrigger
              value="crypto"
              className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer"
            >
              {" "}
              {/* Applied styles from shapedoctor */}
              <Bitcoin className="h-4 w-4" />
              Crypto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buymeacoffee">
            <Card className="border bg-zinc-800/25 shadow-sm">
              {" "}
              {/* Updated className */}
              <CardHeader className="pb-4">
                {" "}
                {/* Adjusted padding */}
                <CardTitle className="text-xl flex items-center gap-2">
                  {" "}
                  {/* Larger title */}
                  <Coffee className="h-5 w-5 text-amber-600" />{" "}
                  {/* Darker amber */}
                  Buy Me a <span className="line-through">Coffee</span> Beer
                </CardTitle>
                <CardDescription>
                  A quick and easy way to show your support.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                {/* Buy Me A Coffee stylized section */}
                <div className="w-full max-w-sm p-6 bg-[#FFDD00] rounded-lg text-center shadow-md">
                  {" "}
                  {/* Adjusted max-width and added shadow */}
                  <Coffee className="h-12 w-12 mx-auto mb-4 text-black" />
                  <h3 className="text-xl font-bold text-black mb-2">
                    Buy Me a <span className="line-through">Coffee</span> Beer
                  </h3>
                  <p className="text-black/90 mb-4 text-sm">
                    {" "}
                    {/* Slightly lighter text */}
                    Your generosity keeps the BuTools project brewing!
                  </p>
                  <Button
                    className="bg-black hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-md transition-all duration-200 transform hover:scale-105 focus:scale-105 hover:shadow-lg" // Added transform, scale, and shadow effects
                    onClick={() =>
                      window.open(
                        "https://www.buymeacoffee.com/foreztgump",
                        "_blank",
                        "noopener noreferrer"
                      )
                    } // Added rel attribute
                    aria-label="Visit Buy Me a Coffee Beer page for foreztgump" // Accessibility
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Buy Me a <span className="line-through">Coffee</span> / Beer
                    <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />{" "}
                    {/* Adjusted spacing and opacity */}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto">
            <Card className="border bg-zinc-800/25 shadow-sm">
              {" "}
              {/* Updated className */}
              <CardHeader className="pb-4">
                {" "}
                {/* Adjusted padding */}
                <CardTitle className="text-xl flex items-center gap-2">
                  {" "}
                  {/* Larger title */}
                  <Bitcoin className="h-5 w-5 text-orange-500" />
                  Cryptocurrency
                </CardTitle>
                <CardDescription>
                  Donate using your preferred cryptocurrency.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm">
                  Send your contribution to one of the following addresses.
                  Please double-check the address and network type before
                  sending.
                </p>

                <div className="space-y-4">
                  {cryptoWallets.map((wallet) => (
                    <div
                      key={wallet.name}
                      className="p-4 border rounded-lg bg-background"
                    >
                      {" "}
                      {/* Added background */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {wallet.icon}
                          <span className="font-medium">{wallet.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={wallet.address}
                          readOnly
                          className="font-mono text-xs flex-1 bg-muted border-muted-foreground/20" // Style adjustments
                          aria-label={`${wallet.name} wallet address`}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            copyToClipboard(wallet.address, wallet.name)
                          }
                          aria-label={`Copy ${wallet.name} address to clipboard`}
                          className="flex-shrink-0" // Prevent shrinking
                        >
                          {copiedWallet === wallet.name ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="sr-only">Copy address</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg text-sm border border-muted-foreground/10">
                  {" "}
                  {/* Adjusted background and border */}
                  <p className="font-medium text-orange-600">
                    Important Reminders:
                  </p>{" "}
                  {/* Added color */}
                  <ul className="list-disc pl-5 space-y-1 mt-2 text-muted-foreground">
                    <li>Verify the wallet address carefully before sending.</li>
                    <li>
                      Ensure you are sending the correct cryptocurrency to the
                      corresponding wallet type (e.g., BTC to BTC address).
                    </li>
                    <li>Cryptocurrency transactions are irreversible.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          {" "}
          {/* Subtle gradient */}
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h2 className="text-xl font-semibold flex items-center justify-center gap-1.5">
                {" "}
                {/* Adjusted font weight and gap */}
                <Heart className="h-5 w-5 text-rose-500" />
                Thank You for Your Support!
              </h2>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-4 pb-6">
            {" "}
            {/* Adjusted padding */}
            <Button
              onClick={() => window.history.back()}
              className="border border-input bg-background text-foreground hover:bg-violet-600 hover:text-white transition-all transform hover:scale-105 hover:shadow-md cursor-pointer" // Applied specific purple hover colors
            >
              Back to Tools
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
