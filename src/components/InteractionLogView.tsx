"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InteractionLogViewProps {
  log: string | null;
}

export function InteractionLogView({ log }: InteractionLogViewProps) {
  if (log === null) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">No interaction log available.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Interaction Log</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <pre className="whitespace-pre-wrap text-sm font-code bg-muted/30 p-4 rounded-md">{log}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
