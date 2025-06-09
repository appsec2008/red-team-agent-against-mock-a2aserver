
"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { THREAT_CATEGORIES, type ThreatCategoryResult, normalizeFlowOutput, type AiFlowOutput } from "@/lib/threatCategories";
import { ThreatCategoryCard } from "./ThreatCategoryCard";
import { VulnerabilityReportView } from "./VulnerabilityReportView";
import { InteractionLogView } from "./InteractionLogView";
import { ShieldCheck, AlertTriangle, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { discoverA2AServer, type DiscoverA2AServerOutput } from "@/ai/flows/discover-a2a-server-flow";


type ThreatCategoryStatus = "idle" | "loading" | "success" | "error";
type ThreatResults = Record<string, { result: ThreatCategoryResult | null; status: ThreatCategoryStatus }>;

export function DashboardClient() {
  const [a2aServerSpec, setA2aServerSpec] = useState<string>("");
  const [threatResults, setThreatResults] = useState<ThreatResults>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"report" | "log">("report");
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSpecChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setA2aServerSpec(event.target.value);
  };

  const handleDiscoverServer = async () => {
    setIsDiscovering(true);
    try {
      const output: DiscoverA2AServerOutput = await discoverA2AServer();
      if (output && output.discoveredSpecification) {
        setA2aServerSpec(output.discoveredSpecification);
        toast({
          title: "Mock Server Specification Generated",
          description: "The A2A server specification has been populated in the text area.",
        });
      } else {
        // This case might occur if the AI returns an empty or malformed response
        throw new Error("AI failed to generate a valid specification.");
      }
    } catch (error) {
      console.error("Error discovering server spec:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during discovery.";
      setA2aServerSpec(`Error: Could not generate A2A server specification.\n${errorMessage}`);
      toast({
        title: "Discovery Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRunTest = async (categoryId: string) => {
    if (!a2aServerSpec && categoryId !== 'supplyChain') {
      toast({
        title: "Missing Specification",
        description: "Please provide the A2A Server Specification or use 'Discover' to generate one before running tests.",
        variant: "destructive",
      });
      return;
    }

    const category = THREAT_CATEGORIES.find(tc => tc.id === categoryId);
    if (!category) return;

    setSelectedCategoryId(categoryId);
    setThreatResults(prev => ({
      ...prev,
      [categoryId]: { result: prev[categoryId]?.result || null, status: "loading" },
    }));

    try {
      const output : AiFlowOutput = await category.action(a2aServerSpec);
      const normalizedResult = normalizeFlowOutput(output, categoryId);
      
      setThreatResults(prev => ({
        ...prev,
        [categoryId]: { result: normalizedResult, status: "success" },
      }));
      toast({
        title: `Test Complete: ${category.name}`,
        description: "Vulnerability report and interaction log updated.",
      });
    } catch (error) {
      console.error("Error running test:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setThreatResults(prev => ({
        ...prev,
        [categoryId]: { 
          result: { 
            vulnerabilityReport: `Error during test: ${errorMessage}`, 
            interactionLog: `Error during test execution for ${category.name}. Check console for details.`
          }, 
          status: "error" 
        },
      }));
      toast({
        title: `Test Failed: ${category.name}`,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  const currentResult = selectedCategoryId ? threatResults[selectedCategoryId]?.result : null;
  const currentStatus = selectedCategoryId ? threatResults[selectedCategoryId]?.status : "idle";

  return (
    <div className="flex flex-col h-screen p-4 md:p-6 lg:p-8 bg-background text-foreground">
      <header className="mb-6">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-headline text-primary">Red Team A2A</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Automated AI-driven vulnerability assessment for Agent-to-Agent (A2A) communication servers.
        </p>
      </header>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {/* Left Panel */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">A2A Server Specification</CardTitle>
              <CardDescription>
                Paste the technical specifications for the A2A server, or click Discover to generate a mock specification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste A2A server specification here, or click 'Discover & Generate' below..."
                value={a2aServerSpec}
                onChange={handleSpecChange}
                className="min-h-[150px] font-code text-sm"
                rows={8}
              />
              <Button 
                onClick={handleDiscoverServer} 
                disabled={isDiscovering}
                variant="outline"
                className="mt-3 w-full"
              >
                {isDiscovering ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Spec...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Discover & Generate Mock A2A Server Spec
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-grow flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Threat Categories</CardTitle>
              <CardDescription>Select a threat category to test against the A2A server.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0">
              <ScrollArea className="h-full p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                  {THREAT_CATEGORIES.map(category => (
                    <ThreatCategoryCard
                      key={category.id}
                      category={category}
                      onRunTest={handleRunTest}
                      status={threatResults[category.id]?.status || "idle"}
                      isSelected={selectedCategoryId === category.id}
                      onSelect={setSelectedCategoryId}
                      disabled={(!a2aServerSpec || a2aServerSpec.startsWith("Error:")) && category.id !== 'supplyChain'}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="md:col-span-2 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "report" | "log")} className="flex-grow flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="report">Vulnerability Report</TabsTrigger>
              <TabsTrigger value="log">Interaction Log</TabsTrigger>
            </TabsList>
            <TabsContent value="report" className="flex-grow mt-2 overflow-hidden">
              {currentStatus === "loading" ? (
                <Card className="h-full">
                  <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full mt-4" />
                  </CardContent>
                </Card>
              ) : currentStatus === "error" && currentResult ? (
                <Card className="h-full border-destructive">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg text-destructive flex items-center gap-2">
                      <AlertTriangle /> Error Generating Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm font-body">{currentResult.vulnerabilityReport}</pre>
                  </CardContent>
                </Card>
              ) : (
                <VulnerabilityReportView report={currentResult?.vulnerabilityReport || null} />
              )}
            </TabsContent>
            <TabsContent value="log" className="flex-grow mt-2 overflow-hidden">
               {currentStatus === "loading" ? (
                <Card className="h-full">
                  <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                  <CardContent className="space-y-4">
                     <Skeleton className="h-20 w-full font-code bg-muted/30 p-4 rounded-md" />
                     <Skeleton className="h-20 w-full font-code bg-muted/30 p-4 rounded-md" />
                  </CardContent>
                </Card>
              ) : currentStatus === "error" && currentResult ? (
                 <Card className="h-full border-destructive">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg text-destructive flex items-center gap-2">
                      <AlertTriangle /> Error in Interaction Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm font-code bg-muted/30 p-4 rounded-md">{currentResult.interactionLog}</pre>
                  </CardContent>
                </Card>
              ) : (
                <InteractionLogView log={currentResult?.interactionLog || null} />
              )}
            </TabsContent>
          </Tabs>
           {!selectedCategoryId && currentStatus === "idle" && (
            <Card className="h-full flex items-center justify-center mt-2">
              <CardContent>
                <p className="text-muted-foreground text-lg text-center">
                  Select a threat category and provide an A2A Server Specification (or generate one) to begin testing.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
